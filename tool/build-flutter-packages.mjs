#!/usr/bin/env node
/**
 * Builds every Flutter package that opts in by placing a `web/package.json`
 * alongside its `pubspec.yaml`, then packs each build output as an npm tarball.
 *
 * Package discovery and per-package Flutter SDK resolution are fully delegated
 * to flutter-mono (tool/flutter-mono.mjs). This script only handles the
 * post-build pipeline: merging package metadata, running `npm pack`, and
 * renaming the resulting tarball.
 *
 * Usage: node tool/build-flutter-packages.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const flutterMono = join(scriptDir, 'flutter-mono.mjs');

function die(msg) {
  console.error(`✗  ${msg}`);
  process.exit(1);
}

// ─── Package discovery ───────────────────────────────────────────────────────

function discoverWebPackages() {
  const result = spawnSync('node', [flutterMono, 'list', '--json'], {
    encoding: 'utf8',
    cwd: repoRoot,
  });

  if (result.error || result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    die('`flutter-mono list` failed — run it directly for details.');
  }

  let all;
  try {
    all = JSON.parse(result.stdout);
  } catch {
    die('Failed to parse package list from flutter-mono.');
  }

  return all
    .filter(({ location }) => existsSync(join(location, 'web', 'package.json')))
    .map(({ name, description, version, location }) => ({
      name,
      description,
      version,
      dir: location,
      webPkgPath: join(location, 'web', 'package.json'),
    }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// "tap_burst_web_component" → "tap-burst-web-component"
function toNpmName(n) {
  return n.replaceAll('_', '-');
}

// ─── Main ────────────────────────────────────────────────────────────────────

const packages = discoverWebPackages();

if (packages.length === 0) {
  die(
    'No packages found.\n' +
    '   Add a web/package.json to a Flutter package directory to opt in.',
  );
}

console.log(`Found ${packages.length} package(s) to build.\n`);

// Delegate clean + build to flutter-mono so each package gets the correct
// FVM-managed Flutter SDK version automatically.
const cleanResult = spawnSync(
  'node',
  [flutterMono, 'exec', '--dir-exists=web', '--', 'flutter', 'clean'],
  { cwd: repoRoot, stdio: 'inherit' },
);

if (cleanResult.status !== 0) {
  die(`Flutter clean failed (exit code ${cleanResult.status ?? '?'}).`);
}

console.log('');

const buildResult = spawnSync(
  'node',
  [flutterMono, 'exec', '--dir-exists=web', '--', 'flutter', 'build', 'web', '--profile'],
  { cwd: repoRoot, stdio: 'inherit' },
);

if (buildResult.status !== 0) {
  die(`Flutter build(s) failed (exit code ${buildResult.status ?? '?'}).`);
}

// Pack each built output as an npm tarball.
console.log('');
for (const { name, description, version, dir, webPkgPath } of packages) {
  if (!name || !version) {
    die(`${dir}: pubspec.yaml is missing required fields (name, version).`);
  }

  const npmName = toNpmName(name);
  console.log(`▶  Packing ${name}…`);

  // Write build/web/package.json by merging pubspec fields into web/package.json.
  const outDir = join(dir, 'build', 'web');
  const webPkg = JSON.parse(readFileSync(webPkgPath, 'utf8'));
  writeFileSync(
    join(outDir, 'package.json'),
    JSON.stringify({ ...webPkg, name: npmName, description: description ?? '', version }, null, 2) + '\n',
    'utf8',
  );

  const packResult = spawnSync('npm', ['pack'], { cwd: outDir, stdio: 'inherit' });
  if (packResult.status !== 0) {
    die(`npm pack failed for ${name} (exit code ${packResult.status ?? '?'}).`);
  }

  // Rename <name>-<version>.tgz → <name>.tgz (drop the version suffix).
  renameSync(
    join(outDir, `${npmName}-${version}.tgz`),
    join(outDir, `${npmName}.tgz`),
  );

  console.log(`✓  ${name} → build/web/${npmName}.tgz\n`);
}

console.log('All packages built successfully.');
