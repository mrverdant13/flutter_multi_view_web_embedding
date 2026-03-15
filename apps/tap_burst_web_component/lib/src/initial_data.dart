import 'dart:js_interop';

/// JS interop type for the `initialData` object passed to the Tap Burst view.
extension type TapBurstInitialData._(JSObject _) implements JSObject {
  /// Number of particles per burst.
  external int get particleCount;

  /// Burst animation duration in milliseconds.
  external int get burstDurationMs;
}
