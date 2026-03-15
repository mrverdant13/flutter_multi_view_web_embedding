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
| `setColor(r, g, b)` | Web → Flutter | Sets the color. Values are floats 0.0–1.0. |
| `onColorChanged` | Flutter → Web | Assign a `(r, g, b) => void` callback. Set to `null` to unsubscribe. |

Refer to the [embedding guide](../../docs/embedding.md) for the full embedding pipeline, including race condition prevention when loading multiple Flutter apps on the same page.
