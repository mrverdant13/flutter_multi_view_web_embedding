# Angular Widgets Preview

An Angular 21 host application that embeds multiple Flutter widgets in a single page using Flutter's multi-view web API. It mirrors the functionality of the Vite-based `widgets_preview` app, demonstrating how to integrate Flutter web components into a real Angular project with idiomatic patterns: standalone components, signals, and a shared base class for view lifecycle management.

---

## What it demonstrates

- Loading `flutter_bootstrap.js` once and reusing the resulting `FlutterApp` instance across multiple views via a singleton Angular service.
- Serialising `_flutter.loader.load()` calls so concurrent widget initialisation never triggers a race condition.
- Managing the full Flutter view lifecycle (bootstrap → `addView` → controller-ready event → `removeView`) inside an abstract Angular directive that widget components extend.
- Driving Flutter widget state from Angular — forwarding signal-based config changes directly to the Flutter controller API via per-view stores.
- Receiving callbacks from Flutter (color changes, parameter updates) and reflecting them in Angular reactive state.

---

## Architecture

### `FlutterBootstrapService`

A root-scoped singleton (`src/app/core/services/flutter-bootstrap.service.ts`) that owns two pieces of shared state:

| Member            | Purpose                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `loadQueue`       | Serialised chain of `loader.load()` promises — prevents concurrent initialisation races                             |
| `appStateSignals` | `Map<"entryPointBaseUrl::assetBaseUrl", WritableSignal<FlutterAppState>>` — one signal per Flutter web component |

Call `loadApp(entryPointBaseUrl, assetBaseUrl)` to trigger loading of a web component (fire-and-forget). Observe `appStateSignal(entryPointBaseUrl, assetBaseUrl)` to react to the resulting `'idle' → 'loading' → 'ready' | 'error'` transitions. Concurrent callers for the same key share the same in-flight signal; a failed signal reverts to `'error'` so the next caller gets a fresh attempt.

The service also exposes the `FLUTTER_BOOTSTRAP_TIMEOUT_MS` injection token (default: 30 000 ms) to configure how long any single initialisation step is allowed to run before it times out.

### `FlutterViewBase<TApi, TData>`

An abstract Angular directive (`src/app/shared/components/flutter-view.base.ts`) that handles the repeating lifecycle pattern. Concrete view components extend it and supply:

| Abstract member     | Provided by subclass                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `entryPointBaseUrl` | URL base for the Flutter entry point script                                      |
| `assetBaseUrl`      | URL base passed to the engine as `assetBase` for resolving Flutter assets        |
| `stateReadyEvent`   | Custom DOM event name the Flutter widget dispatches when its controller is ready |
| `hostRef`           | `Signal<ElementRef>` for the element Flutter renders into, via `viewChild`       |

The base class exposes a single reactive `state` signal of type `FlutterViewState<TApi>`:

| `state` value                           | Meaning                                           |
| --------------------------------------- | ------------------------------------------------- |
| `{ status: 'loading' }`                 | Bootstrap / `addView` in progress                 |
| `{ status: 'ready'; controller: TApi }` | Flutter view mounted; controller API available    |
| `{ status: 'error'; message: string }`  | `addView()` threw; message holds the error detail |

### Component hierarchy

```
AppComponent                         ← root; reads card list from DashboardStore
  <app-widget-catalog>               ← catalog panel; config inputs + "Add" buttons; reads/writes DashboardStore
  <app-widget-card> (×N)             ← one card per entry in DashboardStore.cards(); reads DashboardStore
    <app-tap-burst-view>             ← per-instance wrapper; provides TapBurstViewStore
      <app-tap-burst-flutter-view>   ← extends FlutterViewBase<TapBurstApi>
      <app-tap-burst-control-panel>  ← config controls; reads/writes TapBurstViewStore
    <app-color-mixer-view>           ← per-instance wrapper; provides ColorMixerViewStore
      <app-color-mixer-flutter-view> ← extends FlutterViewBase<ColorMixerApi>
      <app-color-mixer-control-panel>← RGB slider controls; reads/writes ColorMixerViewStore
```

`DashboardStore` (root singleton) owns the card list and shared per-type config defaults. View-level stores hold per-instance controller state and bridge Angular signal updates to the Flutter controller API.

### Flutter ↔ Angular communication

**Angular → Flutter:** the view-level store (`TapBurstViewStore`, `ColorMixerViewStore`) holds a reference to the typed API object. Calling store methods (e.g. `setParticleCount`, `setColor`) writes directly to the controller properties/methods.

**Flutter → Angular:** the Flutter widget dispatches a custom DOM event (`stateReadyEvent`) on the host element when its controller is initialised. The event's `detail` carries the typed API object. `FlutterViewBase` listens for this event inside `ngAfterViewInit()` and transitions `state` to `{ status: 'ready', controller }`. The view wrapper component (`TapBurstViewComponent`, `ColorMixerViewComponent`) uses an Angular `effect()` that watches `state()` and calls the view store's `initFromController(api)` when the status becomes `'ready'`, which wires Flutter callback properties (e.g. `api.onParticleCountChanged`) to update Angular signals.

---

## Project structure

```
apps/angular-widgets-preview/
├── angular.json                         # Angular CLI workspace config; dev server on :3001
├── package.json                         # npm scripts and local Flutter package dependencies
├── tsconfig.json
├── tsconfig.app.json
└── src/
    ├── index.html                       # App shell; loads Google Fonts
    ├── main.ts                          # bootstrapApplication entry point
    ├── styles.css                       # Global dark theme, CSS variables, grid background
    └── app/
        ├── app.component.*              # Root component; top-level layout grid
        ├── core/
        │   ├── models/
        │   │   └── flutter-built-in.types.ts    # FlutterApp, FlutterLoader, _flutter namespace types
        │   └── services/
        │       └── flutter-bootstrap.service.ts  # Singleton loader + signal-based app state
        ├── shared/
        │   ├── components/
        │   │   └── flutter-view.base.ts          # Abstract base directive for Flutter view components
        │   └── styles/
        │       ├── flutter-view.component.css
        │       └── view.component.css
        └── features/
            ├── dashboard/
            │   ├── stores/
            │   │   └── dashboard.store.ts        # Root store: card list + per-type config defaults
            │   └── components/
            │       ├── widget-catalog/           # Catalog panel: config inputs + "Add" buttons
            │       └── widget-card/              # Per-card wrapper rendered for each DashboardCard
            ├── tap-burst/
            │   ├── index.ts                      # Public barrel: components + model types
            │   ├── models/tap-burst.types.ts     # TapBurstApi, TapBurstInitialData, entry point URL, clamp constants
            │   ├── stores/
            │   │   └── tap-burst-view.store.ts
            │   └── components/
            │       ├── tap-burst-view/           # View wrapper: provides TapBurstViewStore
            │       ├── tap-burst-flutter-view/   # Flutter host: extends FlutterViewBase
            │       └── tap-burst-control-panel/  # Config controls
            └── color-mixer/
                ├── index.ts                      # Public barrel: components + model types
                ├── models/color-mixer.types.ts   # ColorMixerApi, ColorMixerInitialData, ColorChannel, entry point URL
                ├── stores/
                │   ├── color-mixer-view.store.ts
                │   ├── with-color-mixer-view.feature.ts
                │   └── with-color-channels.feature.ts
                ├── utils/
                │   └── color-utils.ts            # RGB ↔ hex conversion, gradient helpers
                └── components/
                    ├── color-mixer-view/         # View wrapper: provides ColorMixerViewStore
                    ├── color-mixer-flutter-view/ # Flutter host: extends FlutterViewBase
                    └── color-mixer-control-panel/# RGB slider controls
```

---

## Getting started

**Prerequisites:** [Flutter](https://docs.flutter.dev/get-started/install) (managed via [FVM](https://fvm.app)), Node.js 18+.

Run these commands from the **repo root** first if you have not already:

```sh
# Install Dart/Flutter dependencies across all packages and apps
node tool/flutter-mono.mjs run bootstrap
```

Then, from this directory:

```sh
# Install npm dependencies (includes local Flutter package tarballs)
npm install

# Build the Flutter web components and start the Angular dev server
npm run dev
```

The dev server starts at `http://localhost:3001`.

### Available scripts

| Script              | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run dev`       | Builds Flutter packages, then starts the Angular dev server on `:3001` |
| `npm run build`     | Builds Flutter packages, then produces an optimised bundle in `dist/`  |
| `npm run typecheck` | Runs TypeScript type checking without emitting files                   |
| `npm run lint`      | Runs ESLint across the project                                         |
| `npm run format`    | Formats source files with Prettier                                     |
| `npm test`          | Runs unit tests with Vitest                                            |

> **Note:** `dev` and `build` automatically invoke `build-flutter-packages` before Angular's own build step. You do not need to build the Flutter packages separately.

---

## How Flutter assets are served

The `angular.json` build configuration maps three asset paths to locations inside `node_modules/`, where the pre-built Flutter package tarballs are unpacked:

| URL prefix                                     | Source                                    |
| ---------------------------------------------- | ----------------------------------------- |
| `/flutter-packages/flutter-bootstrap/`         | `node_modules/flutter-bootstrap/`         |
| `/flutter-packages/tap-burst-web-component/`   | `node_modules/tap-burst-web-component/`   |
| `/flutter-packages/color-mixer-web-component/` | `node_modules/color-mixer-web-component/` |

`FlutterBootstrapService` loads `flutter_bootstrap.js` from the `flutter-bootstrap` prefix and passes the component-specific prefix as both `entryPointBaseUrl` and `assetBase` to the Flutter loader.
