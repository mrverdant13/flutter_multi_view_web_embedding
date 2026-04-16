#!/usr/bin/env node
/**
 * flutter-mono — Multi-version Flutter monorepo task runner.
 *
 * Discovers Flutter/Dart packages and runs scripts or arbitrary commands in
 * every matching package, using each package's own Flutter SDK version (via
 * FVM) rather than a single shared SDK.
 *
 * Configuration: flutter_mono.yaml at the repo root.
 *
 * Usage:
 *   node tool/flutter-mono.mjs list [--json]
 *   node tool/flutter-mono.mjs run <script> [filter options]
 *   node tool/flutter-mono.mjs exec -- <command> [filter options]
 *
 * Filter options (run / exec):
 *   --scope=<glob>       Include only packages whose name matches the glob
 *   --flutter            Include only Flutter packages
 *   --dart               Include only Dart-only packages
 *   --dir-exists=<dir>   Include only packages where <dir> exists
 *
 * Script-level filters defined in flutter_mono.yaml are merged with any
 * CLI-level filters.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT_DIR, 'flutter_mono.yaml');

// ─── Minimal YAML parser ─────────────────────────────────────────────────────
//
// Supports the subset of YAML used by flutter_mono.yaml:
//   • Top-level and nested key–value mappings
//   • Block sequences (- item)
//   • Scalar values: strings (quoted or bare), booleans, integers, null, []

function parseYaml(text) {
  const rawLines = text.split('\n');
  let pos = 0;

  function getIndent(line) {
    let i = 0;
    while (i < line.length && line[i] === ' ') i++;
    return i;
  }

  function skipBlank() {
    while (pos < rawLines.length) {
      const t = rawLines[pos].trim();
      if (t && !t.startsWith('#')) break;
      pos++;
    }
  }

  function parseScalar(str) {
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (str === 'null' || str === '~') return null;
    if (str === '[]') return [];
    if (str === '{}') return {};
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    if (/^\d*\.\d+$/.test(str)) return parseFloat(str);
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    return str;
  }

  function parseBlock(parentIndent) {
    skipBlank();
    if (pos >= rawLines.length) return null;
    const line = rawLines[pos];
    const indent = getIndent(line);
    if (indent <= parentIndent) return null;
    const trimmed = line.trim();
    return (trimmed.startsWith('- ') || trimmed === '-')
      ? parseSequence(indent)
      : parseMapping(indent);
  }

  function parseMapping(blockIndent) {
    const obj = {};
    while (pos < rawLines.length) {
      skipBlank();
      if (pos >= rawLines.length) break;
      const line = rawLines[pos];
      const indent = getIndent(line);
      if (indent < blockIndent) break;
      if (indent > blockIndent) { pos++; continue; }
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) { pos++; continue; }
      const key = trimmed.slice(0, colonIdx).trim();
      const rest = trimmed.slice(colonIdx + 1).trim();
      pos++;
      if (rest === '' || rest.startsWith('#')) {
        obj[key] = parseBlock(blockIndent) ?? null;
      } else {
        const valuePart = rest.replace(/\s+#.*$/, '').trim();
        obj[key] = parseScalar(valuePart);
      }
    }
    return obj;
  }

  function parseSequence(blockIndent) {
    const arr = [];
    while (pos < rawLines.length) {
      skipBlank();
      if (pos >= rawLines.length) break;
      const line = rawLines[pos];
      const indent = getIndent(line);
      if (indent < blockIndent) break;
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ') && trimmed !== '-') break;
      const value = trimmed === '-' ? null : trimmed.slice(2).trim();
      pos++;
      arr.push(value === null || value === '' ? (parseBlock(blockIndent) ?? null) : parseScalar(value));
    }
    return arr;
  }

  skipBlank();
  if (pos >= rawLines.length) return {};
  return parseMapping(getIndent(rawLines[pos]));
}

// ─── Config ──────────────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    die(`Config not found: ${relative(ROOT_DIR, CONFIG_PATH)}\nCreate flutter_mono.yaml in the repo root.`);
  }
  const config = parseYaml(readFileSync(CONFIG_PATH, 'utf8'));
  if (!Array.isArray(config.packages) || config.packages.length === 0) {
    die('flutter_mono.yaml: "packages" must be a non-empty list of glob patterns.');
  }
  return config;
}

// ─── Package discovery ───────────────────────────────────────────────────────

function scanForPubspecs(dir, results, depth = 4) {
  if (depth <= 0 || !existsSync(dir)) return;
  if (existsSync(join(dir, 'pubspec.yaml'))) {
    results.push(dir);
    return; // don't recurse into Dart packages
  }
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        scanForPubspecs(join(dir, entry.name), results, depth - 1);
      }
    }
  } catch (_) {}
}

function discoverPackageDirs(config) {
  const ignore = (config.ignore ?? []).map((ig) => ig.replace(/\/{0,1}\*+$/, ''));
  const found = [];

  for (const pattern of config.packages) {
    const baseDir = pattern.replace(/\/{0,1}\*+$/, '').replace(/\/$/, '') || '.';
    scanForPubspecs(join(ROOT_DIR, baseDir), found);
  }

  const unique = [...new Set(found)];
  return unique.filter((dir) => {
    const rel = relative(ROOT_DIR, dir);
    return !ignore.some((ig) => rel === ig || rel.startsWith(ig + '/'));
  });
}

// ─── pubspec.yaml parser ─────────────────────────────────────────────────────
//
// Extracts: name, description, version, environment.flutter, isFlutterPackage.
// Based on the same parser logic as build-flutter-packages.mjs.

function parsePubspec(dir) {
  const pubspecPath = join(dir, 'pubspec.yaml');
  const lines = readFileSync(pubspecPath, 'utf8').split('\n');
  const pkg = { dir, isFlutterPackage: false };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (!trimmed || trimmed.startsWith('#')) { i++; continue; }

    if (trimmed.startsWith('sdk:') && trimmed.slice('sdk:'.length).trim() === 'flutter') {
      pkg.isFlutterPackage = true;
    }

    if (indent !== 0) { i++; continue; }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = trimmed.slice(0, colonIdx).trim();
    const afterColon = trimmed.slice(colonIdx + 1).trim();

    if (['name', 'description', 'version'].includes(key)) {
      // Handle block scalars (">-", ">", "|-", "|").
      if (['>', '>-', '|', '|-'].includes(afterColon)) {
        const folded = afterColon.startsWith('>');
        const blockLines = [];
        i++;
        while (i < lines.length) {
          const bl = lines[i];
          if (bl.trimStart() === bl && bl.trim() !== '') break;
          if (bl.trim()) blockLines.push(bl.trim());
          i++;
        }
        pkg[key] = folded ? blockLines.join(' ') : blockLines.join('\n');
        continue;
      }
      pkg[key] = afterColon.replace(/^["']|["']$/g, '');
      i++;
    } else if (key === 'environment') {
      i++;
      while (i < lines.length) {
        const el = lines[i];
        const eTrimmed = el.trimStart();
        const eIndent = el.length - eTrimmed.length;
        if (eIndent === 0 && eTrimmed && !eTrimmed.startsWith('#')) break;
        if (eTrimmed.startsWith('flutter:')) {
          pkg.flutterConstraint = eTrimmed.slice('flutter:'.length).trim().replace(/^["']|["']$/g, '');
        }
        i++;
      }
    } else {
      i++;
    }
  }

  return pkg;
}

// ─── FVM helpers ─────────────────────────────────────────────────────────────

function getInstalledFvmVersions() {
  const result = spawnSync('fvm', ['list'], { encoding: 'utf8' });
  if (result.status !== 0 || result.error) {
    die('`fvm list` failed — is FVM installed and on PATH?');
  }
  const plain = result.stdout.replace(/\x1b\[[0-9;]*m/g, '');
  const versions = new Set();
  for (const line of plain.split('\n')) {
    if (!line.includes('│')) continue;
    const cell = line.split('│')[1]?.trim() ?? '';
    if (/^\d+\.\d+\.\d+$/.test(cell)) versions.add(cell);
  }
  return versions;
}

function extractLowerBound(constraint) {
  if (!constraint) return null;
  if (/^\d+\.\d+\.\d+$/.test(constraint)) return constraint;
  const m = constraint.match(/>=\s*(\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

function resolveFvmFlutterBin(version) {
  const fvmHome = process.env.FVM_HOME ?? join(homedir(), 'fvm');
  const candidate = join(fvmHome, 'versions', version, 'bin', 'flutter');
  return existsSync(candidate) ? candidate : null;
}

function getFallbackVersion() {
  const fvmrcPath = join(ROOT_DIR, '.fvmrc');
  if (!existsSync(fvmrcPath)) return null;
  const content = readFileSync(fvmrcPath, 'utf8').trim();
  if (content.startsWith('{')) {
    try { return JSON.parse(content).flutter ?? null; } catch (_) {}
  }
  const m = content.match(/^flutter:\s*["']?(\S+?)["']?\s*$/m);
  return m ? m[1] : null;
}

function resolveFlutterBin(pkg, installedVersions, fallbackVersion) {
  const targetVersion = extractLowerBound(pkg.flutterConstraint) ?? fallbackVersion;

  if (!targetVersion) {
    die(
      `${pkg.name}: cannot determine Flutter version.\n` +
      `  Add an "environment.flutter" constraint to its pubspec.yaml, or add .fvmrc at the repo root.`,
    );
  }

  if (!installedVersions.has(targetVersion)) {
    die(
      `${pkg.name}: Flutter ${targetVersion} is not installed in FVM.\n` +
      `  Run: fvm install ${targetVersion}`,
    );
  }

  const bin = resolveFvmFlutterBin(targetVersion);
  if (!bin) {
    die(`${pkg.name}: Flutter ${targetVersion} is listed by FVM but the binary was not found on disk.`);
  }

  return { bin, version: targetVersion };
}

// ─── Filtering ───────────────────────────────────────────────────────────────

function matchGlob(name, pattern) {
  const regex = new RegExp(
    '^' +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*') +
    '$',
  );
  return regex.test(name);
}

function applyFilters(packages, filters) {
  return packages.filter((pkg) => {
    if (filters.scope && !matchGlob(pkg.name, filters.scope)) return false;
    if (filters.flutter && !pkg.isFlutterPackage) return false;
    if (filters.dart && pkg.isFlutterPackage) return false;
    if (filters.dirExists) {
      const dirs = Array.isArray(filters.dirExists) ? filters.dirExists : [filters.dirExists];
      if (!dirs.some((d) => existsSync(join(pkg.dir, d)))) return false;
    }
    return true;
  });
}

// ─── Execution ───────────────────────────────────────────────────────────────

function runInPackage(pkg, command, flutterBin) {
  const dartBin = join(dirname(flutterBin), 'dart');
  const binDir = dirname(flutterBin);
  const pathSep = process.platform === 'win32' ? ';' : ':';

  const result = spawnSync(command, {
    cwd: pkg.dir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FLUTTER: flutterBin,
      DART: dartBin,
      // Prepend the Flutter bin dir so bare `flutter` / `dart` calls in scripts
      // resolve to the correct FVM-managed version for this package.
      PATH: `${binDir}${pathSep}${process.env.PATH}`,
    },
  });

  return result.status ?? 1;
}

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdList(packages, flags) {
  if (flags.json) {
    console.log(JSON.stringify(
      packages.map(({ name, description, version, dir, isFlutterPackage, flutterConstraint }) => ({
        name,
        description: description ?? null,
        version: version ?? null,
        location: dir,
        isFlutterPackage,
        flutterConstraint: flutterConstraint ?? null,
      })),
      null,
      2,
    ));
    return;
  }

  const rows = packages.map(({ name, dir, isFlutterPackage, flutterConstraint }) => ({
    name,
    path: relative(ROOT_DIR, dir),
    kind: isFlutterPackage ? 'flutter' : 'dart',
    flutter: flutterConstraint ?? '(inherit)',
  }));

  const nameW = Math.max(4, ...rows.map((r) => r.name.length));
  const kindW = 7;
  const flutterW = Math.max(7, ...rows.map((r) => r.flutter.length));

  const header = `${'NAME'.padEnd(nameW)}  ${'TYPE'.padEnd(kindW)}  ${'FLUTTER'.padEnd(flutterW)}  PATH`;
  const divider = `${'-'.repeat(nameW)}  ${'-'.repeat(kindW)}  ${'-'.repeat(flutterW)}  ----`;
  console.log(header);
  console.log(divider);
  for (const { name, path, kind, flutter } of rows) {
    console.log(`${name.padEnd(nameW)}  ${kind.padEnd(kindW)}  ${flutter.padEnd(flutterW)}  ${path}`);
  }
  console.log(`\n${packages.length} package(s)`);
}

function runScript(scriptName, packages, config, installedVersions, fallbackVersion, flags, extra) {
  const scripts = config.scripts ?? {};
  const scriptDef = scripts[scriptName];

  if (!scriptDef) {
    const available = Object.keys(scripts).join(', ') || '(none)';
    die(`Unknown script: "${scriptName}".\n  Available: ${available}`);
  }

  const scriptConfig = typeof scriptDef === 'string' ? { run: scriptDef } : scriptDef;
  if (!scriptConfig.run) die(`Script "${scriptName}" has no "run" field.`);

  const command = extra.length > 0 ? `${scriptConfig.run} ${extra.join(' ')}` : scriptConfig.run;

  const scriptFilter = scriptConfig.filter ?? {};
  const merged = {
    scope: flags.scope,
    flutter: flags.flutter || scriptFilter.flutter === true,
    dart: flags.dart || scriptFilter.dart === true,
    dirExists: flags['dir-exists'] ?? scriptFilter.dirExists ?? null,
  };

  const filtered = applyFilters(packages, merged);
  if (filtered.length === 0) {
    console.log('No packages match the specified filters.');
    return;
  }

  console.log(`\nRunning "${scriptName}" in ${filtered.length} package(s)…\n`);

  const failed = [];
  for (const pkg of filtered) {
    const { bin, version } = resolveFlutterBin(pkg, installedVersions, fallbackVersion);
    console.log(`▶  ${pkg.name}  (flutter ${version})`);
    const exitCode = runInPackage(pkg, command, bin);
    if (exitCode !== 0) {
      console.error(`✗  ${pkg.name} failed (exit code ${exitCode})\n`);
      failed.push(pkg.name);
    } else {
      console.log(`✓  ${pkg.name}\n`);
    }
  }

  if (failed.length > 0) die(`${failed.length} package(s) failed: ${failed.join(', ')}`);
  console.log('Done.');
}

function execCommand(command, packages, installedVersions, fallbackVersion, flags) {
  if (!command) die('exec: no command provided. Usage: flutter-mono exec -- <command>');

  const merged = {
    scope: flags.scope,
    flutter: flags.flutter,
    dart: flags.dart,
    dirExists: flags['dir-exists'] ?? null,
  };

  const filtered = applyFilters(packages, merged);
  if (filtered.length === 0) {
    console.log('No packages match the specified filters.');
    return;
  }

  console.log(`\nExecuting in ${filtered.length} package(s)…\n`);

  const failed = [];
  for (const pkg of filtered) {
    const { bin, version } = resolveFlutterBin(pkg, installedVersions, fallbackVersion);
    console.log(`▶  ${pkg.name}  (flutter ${version})`);
    const exitCode = runInPackage(pkg, command, bin);
    if (exitCode !== 0) {
      console.error(`✗  ${pkg.name} failed (exit code ${exitCode})\n`);
      failed.push(pkg.name);
    } else {
      console.log(`✓  ${pkg.name}\n`);
    }
  }

  if (failed.length > 0) die(`${failed.length} package(s) failed: ${failed.join(', ')}`);
  console.log('Done.');
}

// ─── CLI arg parsing ─────────────────────────────────────────────────────────

function parseCliArgs(rawArgs) {
  const dashIdx = rawArgs.indexOf('--');
  const toolArgs = dashIdx !== -1 ? rawArgs.slice(0, dashIdx) : rawArgs;
  const extra = dashIdx !== -1 ? rawArgs.slice(dashIdx + 1) : [];

  const flags = {};
  const positionals = [];

  for (const arg of toolArgs) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      const key = eqIdx !== -1 ? arg.slice(2, eqIdx) : arg.slice(2);
      const val = eqIdx !== -1 ? arg.slice(eqIdx + 1) : true;
      flags[key] = val;
    } else {
      positionals.push(arg);
    }
  }

  return { flags, positionals, extra };
}

// ─── Help ────────────────────────────────────────────────────────────────────

const HELP = `
flutter-mono — Multi-version Flutter monorepo task runner

Usage:
  node tool/flutter-mono.mjs <command> [options]

Commands:
  list              List discovered packages
  run <script>      Run a script defined in flutter_mono.yaml
  exec -- <cmd>     Execute an arbitrary command in each package

Options (run / exec):
  --scope=<glob>       Filter by package name (supports * and **)
  --flutter            Include only Flutter packages
  --dart               Include only Dart-only packages
  --dir-exists=<dir>   Include only packages where <dir> exists

Options (list):
  --json               Output as JSON

Scripts are defined in flutter_mono.yaml. Each package uses the Flutter SDK
version matching the lower bound of its pubspec.yaml environment.flutter
constraint, resolved via FVM. Packages without an explicit constraint inherit
the version pinned in .fvmrc.
`.trimStart();

// ─── Main ────────────────────────────────────────────────────────────────────

function die(msg) {
  console.error(`✗  ${msg}`);
  process.exit(1);
}

const { flags, positionals, extra } = parseCliArgs(process.argv.slice(2));
const [cmd] = positionals;

if (!cmd || cmd === 'help' || flags.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const config = loadConfig();
const packageDirs = discoverPackageDirs(config);
const packages = packageDirs.map(parsePubspec).filter((p) => p.name);
const installedVersions = getInstalledFvmVersions();
const fallbackVersion = getFallbackVersion();

switch (cmd) {
  case 'list':
    cmdList(packages, flags);
    break;

  case 'run': {
    const scriptName = positionals[1];
    if (!scriptName) die('run: no script name specified. Usage: flutter-mono run <script>');
    runScript(scriptName, packages, config, installedVersions, fallbackVersion, flags, extra);
    break;
  }

  case 'exec':
    execCommand(extra.join(' '), packages, installedVersions, fallbackVersion, flags);
    break;

  default:
    die(`Unknown command: "${cmd}". Run with --help for usage.`);
}
