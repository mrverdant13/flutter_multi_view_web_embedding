# color_mixer

An interactive Flutter widget for mixing red, green, and blue color channels through custom gradient sliders.

## What it does

`ColorMixer` renders three draggable RGB sliders. Each slider track is a live gradient that reflects the current values of the other two channels. A large color preview swatch and a hex code update in real time as the user drags.

## API

```dart
ColorMixer({Key? key, ColorMixerController? controller})
```

The widget is stateful. When no `controller` is provided it creates and manages its own internal `ColorMixerController`. Pass an external controller to observe or drive the color from outside the widget tree.

### ColorMixerController

| Member | Type | Default | Notes |
|---|---|---|---|
| `color` | `Color` (getter/setter) | `Color(0xFF000000)` | Alpha is always forced to 1.0. |

`ColorMixerController` extends `ValueNotifier<Color>`. Add a listener to be notified whenever the color changes.

## Usage

`ColorMixer` is a standard Flutter widget and can be placed anywhere in a widget tree.
