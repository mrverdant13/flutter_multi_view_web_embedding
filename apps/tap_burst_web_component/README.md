# tap_burst_web_component

Flutter web app that builds the `tap_burst` widget as an embeddable web component.

## What it does

This app wraps [`TapBurst`](../../packages/tap_burst/) in a [`MultiViewApp`](../../packages/multi_view_app/) root so that the built output can be loaded and attached to arbitrary DOM elements on a host page via `flutterApp.addView()`.

## Building

```sh
flutter build web
```

The build output goes to `build/web/`. The host page loads `main.dart.js` from there as the entry point for the tap burst widget.

## Embedding

On the host page, after loading [`flutter_bootstrap.js`](../../packages/flutter_bootstrap/):

```js
_flutter.loader.load({
  config: { entrypointBaseUrl: '<base-url>' },
  onEntrypointLoaded: async (engineInitializer) => {
    const appRunner = await engineInitializer.initializeEngine({
      assetBase: '<base-url>',
      multiViewEnabled: true,
    });
    const flutterApp = await appRunner.runApp(); // cache this
    const viewId = flutterApp.addView({
      hostElement: document.getElementById('<host-id>'),
      initialData: { particleCount: 20, burstDurationMs: 600 }, // optional
    });
  },
});
```

### `initialData` shape

| Field | Type | Notes |
|---|---|---|
| `particleCount` | `number` | Number of particles per burst. Clamped to 1–200. |
| `burstDurationMs` | `number` | Burst animation duration in milliseconds. Clamped to 100–5000. |

All fields are optional. Omitted fields use the widget defaults (`particleCount: 10`, `burstDurationMs: 800`).

### JS API

Once the Flutter widget is ready, it dispatches a `flutter::state_ready` CustomEvent on the host element. The event does not bubble. The `event.detail` object is the live API:

```js
hostElement.addEventListener('flutter::state_ready', (event) => {
  const api = event.detail;

  // Web → Flutter: adjust particle count and burst duration
  api.particleCount = 30;      // integer, clamped to 1–200
  api.burstDuration = 500;     // milliseconds, clamped to 100–5000

  // Flutter → Web: receive change notifications
  api.onParticleCountChanged = (n) => {
    console.log('Particle count:', n);
  };
  api.onBurstDurationChanged = (ms) => {
    console.log('Burst duration:', ms, 'ms');
  };
}, { once: true });
```

| Member | Direction | Notes |
|---|---|---|
| `particleCount` | Web → Flutter | Read/write. Integer, clamped to 1–200. |
| `burstDuration` | Web → Flutter | Read/write. Milliseconds, clamped to 100–5000. |
| `onParticleCountChanged` | Flutter → Web | Assign a `(n: number) => void` callback. Set to `null` to unsubscribe. |
| `onBurstDurationChanged` | Flutter → Web | Assign a `(ms: number) => void` callback. Set to `null` to unsubscribe. |

Refer to the [embedding guide](../../docs/embedding.md) for the full embedding pipeline, including race condition prevention when loading multiple Flutter apps on the same page.

## Testing

```sh
# Widget and controller tests, which require Chrome (dart:js_interop / dart:ui_web)
flutter test --platform chrome

# Coverage, which runs a VM-only placeholder test and produces an empty lcov (100%)
flutter test --coverage
```

All source files in this app depend on `dart:js_interop` or `dart:ui_web`, which are browser-only libraries unavailable on the Dart VM. The widget and controller test files are therefore annotated `@TestOn('browser')` and must run with `--platform chrome`.

`flutter test --coverage` runs a single VM-compatible placeholder test and produces an empty `coverage/lcov.info`. The empty report reflects that no lib source is reachable from the VM, not a gap in test quality — the substantive coverage is provided by the Chrome test suite. `flutter test --platform chrome --coverage` is not supported by the Flutter tooling and does not produce a coverage report.
