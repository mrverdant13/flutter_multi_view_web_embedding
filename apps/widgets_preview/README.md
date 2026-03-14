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

`src/main.ts` loads `flutter_bootstrap.js` once and then sets up each widget card for on-demand view management. No views are mounted on load. The user creates them by clicking the **+ Add view** button on each card. Every view is rendered inside a labelled wrapper with a per-view **×** remove button; the underlying Flutter view is properly detached via `flutterApp.removeView()` when dismissed. `src/main.ts` maintains a `viewRegistry` (keyed on `basePath`) to track active view entries and target individual removals. The serial-queue logic in `src/custom_bootstrap.ts` ensures Flutter apps are initialised safely regardless of how many views are added concurrently. See the [embedding guide](../../docs/embedding.md) for a detailed explanation of the embedding pipeline and the race-condition prevention pattern.

Because `_flutter.loader.load()` is only called on the first **+ Add view** click, each web component's entry point (`main.dart.js`) is fetched lazily. Nothing is downloaded until the user requests a view. You can verify this in Chromium DevTools: open the **Sources** tab before adding any view and confirm that neither `tap-burst` nor `color-mixer` assets appear. They are fetched only after the corresponding button is clicked.

## Project structure

```
apps/widgets_preview/
├── public/              # Flutter build outputs (generated, git-ignored)
├── scripts/
│   └── build-flutter.mjs  # Builds Flutter packages into public/
├── src/
│   ├── custom_bootstrap.ts  # Serial-queue Flutter loader helper
│   ├── main.ts              # Entry point: wires up on-demand view management
│   └── style.css            # Page styles
├── index.html
├── package.json
└── vite.config.ts
```
