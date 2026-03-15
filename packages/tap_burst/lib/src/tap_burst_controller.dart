part of 'tap_burst.dart';

/// Controls a [TapBurst] widget.
class TapBurstController implements Listenable {
  /// Creates a [TapBurstController].
  TapBurstController({
    int particleCount = defaultParticleCount,
    Duration burstDuration = defaultBurstDuration,
  })  : particleCountNotifier =
            ValueNotifier(particleCount.asValidParticleCount),
        burstDurationNotifier = ValueNotifier(burstDuration);

  /// Default number of particles per burst.
  static const defaultParticleCount = 10;

  /// Default burst animation duration.
  static const defaultBurstDuration = Duration(milliseconds: 800);

  /// The notifier for the particle count.
  @protected
  final ValueNotifier<int> particleCountNotifier;

  /// The notifier for the burst duration.
  @protected
  final ValueNotifier<Duration> burstDurationNotifier;

  late final Listenable _merged = Listenable.merge([
    particleCountNotifier,
    burstDurationNotifier,
  ]);

  @override
  void addListener(VoidCallback listener) {
    _merged.addListener(listener);
  }

  @override
  void removeListener(VoidCallback listener) {
    _merged.removeListener(listener);
  }

  /// Number of particles per burst (clamped to 1–200).
  int get particleCount => particleCountNotifier.value;
  set particleCount(int n) =>
      particleCountNotifier.value = n.asValidParticleCount;

  /// Duration of each burst animation (clamped to 100–5000 ms).
  Duration get burstDuration => burstDurationNotifier.value;
  set burstDuration(Duration d) => burstDurationNotifier.value = d;

  /// Releases the internal [ValueNotifier]s.
  void dispose() {
    particleCountNotifier.dispose();
    burstDurationNotifier.dispose();
  }
}

extension on int {
  int get asValidParticleCount => clamp(1, 200).toInt();
}
