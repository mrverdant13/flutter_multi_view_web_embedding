# color_mixer_web_component

Flutter web app that builds the `color_mixer` widget as an embeddable web component.

## What it does

This app wraps [`ColorMixer`](../../packages/color_mixer/) in a [`MultiViewApp`](../../packages/multi_view_app/) root so that the built output can be loaded and attached to arbitrary DOM elements on a host page via `flutterApp.addView()`.

## Building

```sh
flutter build web
```

The build output goes to `build/web/`. The host page loads `main.dart.js` from there as the entry point for the color mixer widget.

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
      initialData: { r: 0.5, g: 0.2, b: 0.8 }, // optional initial color
    });
  },
});
```

### `initialData` shape

| Field | Type | Notes |
|---|---|---|
| `r` | `number` | Red channel, float 0.0–1.0. |
| `g` | `number` | Green channel, float 0.0–1.0. |
| `b` | `number` | Blue channel, float 0.0–1.0. |

All fields are optional. Omitted channels default to `0.0`.

### JS API

Once the Flutter widget is ready, it dispatches a `flutter::state_ready` CustomEvent on the host element. The event does not bubble. The `event.detail` object is the live API:

```js
hostElement.addEventListener('flutter::state_ready', (event) => {
  const api = event.detail;

  // Read current color channels (0.0–1.0)
  console.log(api.r, api.g, api.b);

  // Web → Flutter: update the displayed color
  api.setColor(0.1, 0.9, 0.4); // r, g, b as floats 0.0–1.0

  // Flutter → Web: receive color changes driven by the user
  api.onColorChanged = (r, g, b) => {
    console.log('Color changed:', r, g, b);
  };
}, { once: true });
```

| Member | Direction | Notes |
|---|---|---|
| `r` | Flutter → Web | Read-only. Red channel of the current color, float 0.0–1.0. |
| `g` | Flutter → Web | Read-only. Green channel of the current color, float 0.0–1.0. |
| `b` | Flutter → Web | Read-only. Blue channel of the current color, float 0.0–1.0. |
| `setColor(r, g, b)` | Web → Flutter | Sets the color. Values are floats 0.0–1.0. |
| `onColorChanged` | Flutter → Web | Assign a `(r, g, b) => void` callback. Set to `null` to unsubscribe. |

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
