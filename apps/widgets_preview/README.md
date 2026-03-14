# widgets_preview

A Vite + TypeScript host page that demonstrates both Flutter web components (`tap_burst` and `color_mixer`) embedded side by side on a single HTML page via the multi-view API.

## Prerequisites

- Node.js
- Flutter (via FVM or on `PATH`)

## Setup

```sh
npm install
```

## Development

```sh
npm start
```

This runs `scripts/build-flutter.mjs` first (builds all Flutter packages into `public/`), then starts the Vite dev server at `http://localhost:3000`.

## Production build

```sh
npm run build
```

Output is written to `dist/`.

## How it works

| Path | Content |
|---|---|
| `public/flutter-bootstrap/` | Shared Flutter engine loader (`flutter_bootstrap.js`) |
| `public/tap-burst/` | Built `tap_burst_web_component` assets |
| `public/color-mixer/` | Built `color_mixer_web_component` assets |

`src/main.ts` loads `flutter_bootstrap.js` once, then mounts both widgets in parallel using the serial-queue helper in `src/custom_bootstrap.ts`. See the [root README](../../README.md) for a detailed explanation of the embedding pipeline and the race-condition prevention pattern.

## Project structure

```
apps/widgets_preview/
├── public/              # Flutter build outputs (generated, git-ignored)
├── scripts/
│   └── build-flutter.mjs  # Builds Flutter packages into public/
├── src/
│   ├── custom_bootstrap.ts  # Serial-queue Flutter loader helper
│   ├── main.ts              # Entry point: mounts both widgets
│   └── style.css            # Page styles
├── index.html
├── package.json
└── vite.config.ts
```
