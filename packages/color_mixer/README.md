# color_mixer

An interactive Flutter widget for mixing red, green, and blue color channels through custom gradient sliders.

## What it does

`ColorMixer` renders three draggable RGB sliders. Each slider track is a live gradient that reflects the current values of the other two channels. A large color preview swatch and a hex code update in real time as the user drags.

## API

```dart
ColorMixer({Key? key})
```

The widget is stateful and manages its own RGB values internally. There are no required parameters and no callbacks. It is intended as a standalone interactive demonstration.

## Usage

`ColorMixer` is a standard Flutter widget and can be placed anywhere in a widget tree.
