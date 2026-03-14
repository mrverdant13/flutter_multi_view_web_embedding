# multi_view_app

A reusable Flutter package providing `MultiViewApp`, which is the root widget for Flutter apps embedded as web components via the multi-view API.

## What it does

In multi-view mode, Flutter can render into multiple independent DOM elements on the same host page. `MultiViewApp` observes the platform dispatcher for view additions and removals and calls a builder callback for each active view, wrapping each one in a `View` widget.

## API

```dart
MultiViewApp({
  required WidgetBuilder viewBuilder,
})
```

| Parameter | Description |
|---|---|
| `viewBuilder` | Called once per active view to obtain the widget tree for that view. Use `View.of(context)` inside the builder to access the current `FlutterView`. |

## Usage

Replace `runApp` with `runWidget` and pass a `MultiViewApp` as the root:

```dart
import 'package:flutter/widgets.dart';
import 'package:multi_view_app/multi_view_app.dart';

void main() {
  runWidget(
    MultiViewApp(
      viewBuilder: (_) => const MyWidget(),
    ),
  );
}
```

`MultiViewApp` automatically handles views being added or removed at runtime via `flutterApp.addView()` / `flutterApp.removeView()` on the JavaScript side.

## Notes

- Do not use `runApp`. Use `runWidget`. `runApp` expects a single root view and is incompatible with multi-view mode.
- `MultiViewApp` does not require a `WidgetsApp`, `MaterialApp`, or `CupertinoApp` ancestor. Widgets placed in `viewBuilder` should be self-contained.
