# flutter_bootstrap

A minimal Flutter app whose sole purpose is to produce `flutter_bootstrap.js`, the script that registers the shared Flutter engine loader used for multi-view web embedding.

## What it does

When built for web, Flutter generates a `flutter_bootstrap.js` file that registers `_flutter.loader` on the global `window` object. Every Flutter web component on the host page loads this shared file once so the Flutter engine is initialized a single time, regardless of how many independent widgets are embedded.

This package intentionally renders nothing. It exists purely as a build target.

## Building

```sh
flutter build web
```

The output directory (`build/web/`) contains `flutter_bootstrap.js` along with the rest of the Flutter web assets. Only `flutter_bootstrap.js` is needed by host pages. The widget-specific assets are produced by each web component app.

## Usage on the host page

Include `flutter_bootstrap.js` via an `async` script tag **before** any widget-specific entry points. The `async` attribute ensures it is fetched without blocking page rendering, but any code that relies on `_flutter.loader` must only run after the script has finished loading:

```html
<script src="/flutter-bootstrap/flutter_bootstrap.js" async></script>
```

Refer to the [root README](../../README.md) for the full initialization pipeline.
