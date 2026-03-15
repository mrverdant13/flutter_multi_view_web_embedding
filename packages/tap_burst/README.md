# tap_burst

An interactive Flutter widget that renders animated particle bursts at tap positions.

## What it does

`TapBurst` fills its available space with a dark background and responds to every tap with a burst of colorful particles that radiate outward and fade away.

## API

```dart
TapBurst({Key? key, TapBurstController? controller})
```

The widget is stateful. When no `controller` is provided it creates and manages its own internal `TapBurstController`. Pass an external controller to read or update `particleCount` and `burstDuration` from outside the widget tree.

### TapBurstController

| Member | Type | Default | Notes |
|---|---|---|---|
| `particleCount` | `int` (getter/setter) | `10` | Clamped to 1–200. |
| `burstDuration` | `Duration` (getter/setter) | `800 ms` | Clamped to 100–5000 ms. |

`TapBurstController` implements `Listenable`. Add a listener to be notified when either property changes.

## Usage

`TapBurst` is a standard Flutter widget and can be placed anywhere in a widget tree.