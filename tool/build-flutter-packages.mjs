#!/usr/bin/env node
/**
 * Builds every Flutter package that has a `web/package.json` file, using the
 * lower bound of the Flutter SDK constraint in each package's `pubspec.yaml`
 * (`environment.flutter`).
 *
 * Verification: pinned versions are checked against `fvm list` before
 * building. If a version is missing, the tool exits with an actionable error.
 *
 * After a successful build, writes `build/web/package.json` by merging:
 *   - name, description, version  →  derived from pubspec.yaml
 *   - all other fields            →  carried over from web/package.json
 *
 * A package opts in to this tool by having both `pubspec.yaml` and
 * `web/package.json` inside its directory.
 *
 * Usage: node tool/build-flutter-packages.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// ─── pubspec.yaml parser ────────────────────────────────────────────────────
//
// Extracts only the fields this tool needs:
//   name, description, version  (top-level scalars / block scalars)
//   environment.flutter         (nested scalar)

function parsePubspec(pubspecPath) {
  const lines = readFileSync(pubspecPath, 'utf8').split('\n');
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    // Only process non-empty, non-comment, top-level lines.
    if (indent !== 0 || !trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = trimmed.slice(0, colonIdx).trim();
    const afterColon = trimmed.slice(colonIdx + 1).trim();

    if (['name', 'description', 'version'].includes(key)) {
      // Block scalar (">-", ">", "|-", "|"): collect indented continuation lines.
      if (afterColon === '>-' || afterColon === '>' || afterColon === '|-' || afterColon === '|') {
        const folded = afterColon.startsWith('>');
        const blockLines = [];
        i++;
        while (i < lines.length) {
          const bl = lines[i];
          // A non-empty line with no leading whitespace means we're back at top-level.
          if (bl.trimStart() === bl && bl.trim() !== '') break;
          if (bl.trim()) blockLines.push(bl.trim());
          i++;
        }
        result[key] = folded ? blockLines.join(' ') : blockLines.join('\n');
        continue;
      }
      // Simple / quoted scalar.
      result[key] = afterColon.replace(/^["']|["']$/g, '');
    } else if (key === 'environment') {
      // Parse the nested environment mapping.
      i++;
      while (i < lines.length) {
        const el = lines[i];
        const eTrimmed = el.trimStart();
        const eIndent = el.length - eTrimmed.length;
        // A non-empty, non-comment line at indent 0 means we left the block.
        if (eIndent === 0 && eTrimmed && !eTrimmed.startsWith('#')) break;
        if (eTrimmed.startsWith('flutter:')) {
          result.flutterConstraint = eTrimmed
            .slice('flutter:'.length)
            .trim()
            .replace(/^["']|["']$/g, '');
        }
        i++;
      }
      continue;
    }

    i++;
  }

  return result;
}

// ─── FVM helpers ────────────────────────────────────────────────────────────

/** Returns the set of Flutter versions installed locally according to FVM. */
function getInstalledFvmVersions() {
  const result = spawnSync('fvm', ['list'], { encoding: 'utf8' });
  if (result.status !== 0 || result.error) {
    console.error('✗  `fvm list` failed — is FVM installed and on PATH?');
    process.exit(1);
  }
  // Strip ANSI escape codes before parsing.
  const plain = result.stdout.replace(/\x1b\[[0-9;]*m/g, '');
  const versions = new Set();
  for (const line of plain.split('\n')) {
    // Table data rows are delimited by │; the version is the first cell.
    if (!line.includes('│')) continue;
    const firstCell = line.split('│')[1]?.trim() ?? '';
    if (/^\d+\.\d+\.\d+$/.test(firstCell)) versions.add(firstCell);
  }
  return versions;
}

/**
 * Extracts the lower bound version from a Flutter SDK constraint string.
 *
 * Examples:
 *   "3.41.1"           → "3.41.1"  (exact pin is its own lower bound)
 *   ">=3.6.0 <4.0.0"  → "3.6.0"
 *   ">=3.6.0"          → "3.6.0"
 *   ">3.6.0 <4.0.0"   → "3.6.0"
 *
 * Returns null when no lower bound can be determined (absent or malformed).
 */
function extractLowerBound(constraint) {
  if (!constraint) return null;
  // Exact pin — no operators.
  if (/^\d+\.\d+\.\d+$/.test(constraint)) return constraint;
  // Range — grab the version that follows ">=" or ">".
  const m = constraint.match(/>=?\s*(\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

/**
 * Resolves the path to the `flutter` binary for a given FVM-installed version.
 * Returns null if the binary cannot be found on disk.
 */
function resolveFvmFlutterBin(version) {
  const candidate = join(process.env.HOME, 'fvm', 'versions', version, 'bin', 'flutter');
  return existsSync(candidate) ? candidate : null;
}

// ─── Package discovery ──────────────────────────────────────────────────────

/** Finds all packages that have both `pubspec.yaml` and `web/package.json`. */
function discoverPackages() {
  const searchRoots = [join(repoRoot, 'packages'), join(repoRoot, 'apps')];
  const found = [];

  for (const root of searchRoots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(root, entry.name);
      const pubspecPath = join(dir, 'pubspec.yaml');
      const webPkgPath = join(dir, 'web', 'package.json');
      if (existsSync(pubspecPath) && existsSync(webPkgPath)) {
        found.push({ dir, pubspecPath, webPkgPath });
      }
    }
  }

  return found;
}

// ─── Conversion helpers ─────────────────────────────────────────────────────

//"tap_burst_web_component" → "tap-burst-web-component"
function toNpmName(n) {
  return n.replaceAll('_', '-');
}

// ─── Main ───────────────────────────────────────────────────────────────────

const installedFvmVersions = getInstalledFvmVersions();
if (installedFvmVersions.size === 0) {
  console.error('✗  No Flutter versions installed in FVM.');
  process.exit(1);
}

const packages = discoverPackages();

if (packages.length === 0) {
  console.error(
    '✗  No packages found.\n' +
    '   Add a web/package.json to a Flutter package directory to opt in.',
  );
  process.exit(1);
}

console.log(`Found ${packages.length} package(s) to build.\n`);

for (const pkg of packages) {
  const { name, description, version, flutterConstraint } = parsePubspec(pkg.pubspecPath);

  if (!name || !version) {
    console.error(`✗  ${pkg.dir}: pubspec.yaml is missing required fields (name, version).`);
    process.exit(1);
  }

  console.log(`▶  Building ${name}…`);

  // Resolve the Flutter executable to use for this package.
  let flutterCmd;

  const targetVersion = extractLowerBound(flutterConstraint);

  if (!targetVersion) {
    console.error(`✗  ${name}: could not determine a Flutter version from constraint: "${flutterConstraint ?? '(none)'}".`);
    process.exit(1);
  }

  if (!installedFvmVersions.has(targetVersion)) {
    console.error(`✗  Flutter ${targetVersion} is not installed in FVM.`);
    console.error(`   Run: fvm install ${targetVersion}`);
    process.exit(1);
  }

  const bin = resolveFvmFlutterBin(targetVersion);
  if (!bin) {
    console.error(
      `✗  Flutter ${targetVersion} is listed by FVM but the binary was not found on disk.`,
    );
    process.exit(1);
  }

  flutterCmd = bin;

  // Print the actual Flutter version before building.
  const versionResult = spawnSync(flutterCmd, ['--version'], { encoding: 'utf8' });
  process.stdout.write(`\x1b[32m${versionResult.stdout}\x1b[0m`);

  // Run: <flutter> build web
  const buildResult = spawnSync(flutterCmd, ['build', 'web', '--profile'], {
    cwd: pkg.dir,
    stdio: 'inherit',
  });
  if (buildResult.status !== 0) {
    console.error(`✗  Flutter build failed for ${name} (exit code ${buildResult.status ?? '?'}).`);
    process.exit(buildResult.status ?? 1);
  }

  // Write build/web/package.json
  const webPkg = JSON.parse(readFileSync(pkg.webPkgPath, 'utf8'));
  const outputPkg = {
    name: toNpmName(name),
    description: description ?? '',
    version,
    ...webPkg,
  };

  const outDir = join(pkg.dir, 'build', 'web');
  const outPath = join(outDir, 'package.json');
  writeFileSync(outPath, JSON.stringify(outputPkg, null, 2) + '\n', 'utf8');

  // Pack the build output into a tarball.
  const packResult = spawnSync('npm', ['pack'], { cwd: outDir, stdio: 'inherit' });
  if (packResult.status !== 0) {
    console.error(`✗  npm pack failed for ${name} (exit code ${packResult.status ?? '?'}).`);
    process.exit(packResult.status ?? 1);
  }

  // Rename <name>-<version>.tgz → <name>.tgz (drop the version suffix).
  const npmName = toNpmName(name);
  renameSync(
    join(outDir, `${npmName}-${version}.tgz`),
    join(outDir, `${npmName}.tgz`),
  );

  console.log(`✓  ${name} → build/web/${npmName}.tgz\n`);
}

console.log('All packages built successfully.');
