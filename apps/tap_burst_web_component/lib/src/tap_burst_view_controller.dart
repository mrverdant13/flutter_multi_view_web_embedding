import 'dart:js_interop';

import 'package:tap_burst/tap_burst.dart';

/// A [TapBurstViewController] that also serves as the JS API object for web
/// embedding.
@JSExport()
class TapBurstViewController extends TapBurstController {
  /// Creates a [TapBurstViewController].
  TapBurstViewController({
    super.particleCount = TapBurstController.defaultParticleCount,
    super.burstDuration = TapBurstController.defaultBurstDuration,
  }) {
    particleCountNotifier.addListener(_notifyParticleCountJs);
    burstDurationNotifier.addListener(_notifyBurstDurationJs);
  }

  /// JS callback invoked when particle count changes.
  JSFunction? onParticleCountChanged;

  /// JS callback invoked when burst duration changes.
  JSFunction? onBurstDurationChanged;

  @JSExport()
  @override
  int get particleCount {
    return super.particleCount;
  }

  @JSExport()
  @override
  set particleCount(int n) => super.particleCount = n;

  @JSExport('burstDuration')
  set burstDurationMs(int burstDurationMs) {
    super.burstDuration = Duration(milliseconds: burstDurationMs);
  }

  /// Duration of each burst animation (clamped to 100–5000 ms).
  @JSExport('burstDuration')
  int get burstDurationMs => super.burstDuration.inMilliseconds;

  void _notifyParticleCountJs() {
    onParticleCountChanged?.callAsFunction(
      null,
      particleCount.toJS,
    );
  }

  void _notifyBurstDurationJs() {
    onBurstDurationChanged?.callAsFunction(
      null,
      burstDuration.inMilliseconds.toJS,
    );
  }

  @override
  void dispose() {
    particleCountNotifier.removeListener(_notifyParticleCountJs);
    burstDurationNotifier.removeListener(_notifyBurstDurationJs);
    onParticleCountChanged = null;
    onBurstDurationChanged = null;
    super.dispose();
  }
}
