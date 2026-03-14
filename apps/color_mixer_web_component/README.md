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
  config: { entryPointBaseUrl: '<base-url>' },
  onEntrypointLoaded: async (engineInitializer) => {
    const appRunner = await engineInitializer.initializeEngine({
      assetBase: '<base-url>',
      multiViewEnabled: true,
    });
    const flutterApp = await appRunner.runApp(); // cache this
    await flutterApp.addView({ hostElement: document.getElementById('<host-id>') });
  },
});
```

Refer to the [root README](../../README.md) for the full embedding pipeline, including race condition prevention when loading multiple Flutter apps on the same page.
