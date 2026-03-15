import 'dart:js_interop';

/// JS interop type for the `initialData` object passed to the Color Mixer view.
extension type ColorMixerInitialData._(JSObject _) implements JSObject {
  /// Red channel, float 0.0–1.0.
  external double get r;

  /// Green channel, float 0.0–1.0.
  external double get g;

  /// Blue channel, float 0.0–1.0.
  external double get b;
}
