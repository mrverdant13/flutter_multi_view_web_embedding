/**
 * Builds each Flutter package and copies the output into the corresponding
 * public/ subdirectory so Vite serves it at the right base path.
 *
 *   packages/flutter_bootstrap        →  public/flutter-bootstrap/ (/flutter-bootstrap/)
 *   apps/tap_burst_web_component      →  public/tap-burst/         (/tap-burst/)
 *   apps/color_mixer_web_component    →  public/color-mixer/       (/color-mixer/)
 *
 * The flutter_bootstrap package is built first: its flutter_bootstrap.js
 * provides the shared Flutter engine loader (_flutter / _flutter.loader).
 *
 * Uses the FVM-managed Flutter SDK when available, falls back to `flutter`
 * on PATH otherwise.
 *
 * Usage: node scripts/build-flutter.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(root, '..');
const repoRoot = join(projectRoot, '..', '..');

const fvmBin = join(repoRoot, '.fvm', 'flutter_sdk', 'bin', 'flutter');
const flutterBin = existsSync(fvmBin) ? fvmBin : 'flutter';

const widgets = [
  // Built first: provides the shared Flutter engine loader (flutter_bootstrap.js).
  {
    name: 'flutter_bootstrap',
    src: join(repoRoot, 'packages', 'flutter_bootstrap'),
    dest: join(projectRoot, 'public', 'flutter-bootstrap'),
  },
  {
    name: 'tap_burst_web_component',
    src: join(repoRoot, 'apps', 'tap_burst_web_component'),
    dest: join(projectRoot, 'public', 'tap-burst'),
  },
  {
    name: 'color_mixer_web_component',
    src: join(repoRoot, 'apps', 'color_mixer_web_component'),
    dest: join(projectRoot, 'public', 'color-mixer'),
  },
];

for (const widget of widgets) {
  if (!existsSync(widget.src)) {
    console.error(`✗  Source not found: ${widget.src}`);
    process.exit(1);
  }
  console.log(`\n▶  Building ${widget.name}…`);
  // Use the --web-output or --output option to build directly into widget.dest
  // (web support: --web-output is old, --output is new as of Flutter 3.10+)
  if (existsSync(widget.dest)) rmSync(widget.dest, { recursive: true });
  mkdirSync(widget.dest, { recursive: true });
  execSync(
    `"${flutterBin}" build web --output "${widget.dest}"`,
    { cwd: widget.src, stdio: 'inherit' }
  );

  console.log(`✓  ${widget.name} ready`);
}
