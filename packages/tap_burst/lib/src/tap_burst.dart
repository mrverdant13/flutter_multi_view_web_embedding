import 'dart:math' as math;

import 'package:flutter/widgets.dart';

part 'tap_burst_controller.dart';

const _kGridColor = Color(0xFF2D2820);
const _kGridSize = 40.0;
const _kPalette = <Color>[
  Color(0xFFFF6B6B),
  Color(0xFFFFD93D),
  Color(0xFF6BCB77),
  Color(0xFF4D96FF),
  Color(0xFFFF6FCF),
  Color(0xFF00CFFF),
  Color(0xFFFF9A3C),
  Color(0xFFB983FF),
];

class _Burst {
  _Burst({
    required this.position,
    required this.controller,
    required this.color,
    required this.angles,
    required this.radii,
    required this.sizes,
  });

  final Offset position;
  final AnimationController controller;
  final Color color;
  final List<double> angles;
  final List<double> radii;
  final List<double> sizes;
}

/// An interactive widget that creates animated particle bursts at each tap
/// position.
///
/// Tap anywhere to trigger a burst of colorful particles that radiate outward
/// and fade away. Each tap cycles through a palette of vivid colors.
///
/// This widget is self-contained and does not require a [WidgetsApp] ancestor.
///
/// Provide a [TapBurstController] to configure particle count and burst
/// duration. If omitted, an internal controller is used.
class TapBurst extends StatefulWidget {
  /// Creates a [TapBurst] widget.
  const TapBurst({super.key, this.controller});

  /// Optional controller for configuring particle count and burst duration.
  final TapBurstController? controller;

  @override
  State<TapBurst> createState() => _TapBurstState();
}

class _TapBurstState extends State<TapBurst> with TickerProviderStateMixin {
  final _bursts = <_Burst>[];
  final _random = math.Random();
  var _colorIndex = 0;

  TapBurstController? _internalController;

  TapBurstController get _controller =>
      widget.controller ?? _internalController!;

  @override
  void initState() {
    super.initState();
    if (widget.controller == null) {
      _internalController = TapBurstController();
    }
  }

  @override
  void didUpdateWidget(TapBurst oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      if (widget.controller != null) {
        _internalController?.dispose();
        _internalController = null;
      } else {
        _internalController ??= TapBurstController();
      }
    }
  }

  @override
  void dispose() {
    _internalController?.dispose();
    _internalController = null;
    for (final burst in _bursts) {
      burst.controller.dispose();
    }
    super.dispose();
  }

  void _createBurst(Offset position) {
    final color = _kPalette[_colorIndex % _kPalette.length];
    _colorIndex++;

    final particleCount = _controller.particleCount;
    final angles = List<double>.generate(particleCount, (i) {
      final base = (i / particleCount) * math.pi * 2;
      return base + (_random.nextDouble() - 0.5) * 0.7;
    });
    final radii = List<double>.generate(
      particleCount,
      (_) => 50 + _random.nextDouble() * 45,
    );
    final sizes = List<double>.generate(
      particleCount,
      (_) => 5 + _random.nextDouble() * 6,
    );

    final animController = AnimationController(
      vsync: this,
      duration: _controller.burstDuration,
    );
    final burst = _Burst(
      position: position,
      controller: animController,
      color: color,
      angles: angles,
      radii: radii,
      sizes: sizes,
    );

    animController
      ..addListener(() {
        if (mounted) setState(() {});
      })
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed && mounted) {
          setState(() => _bursts.remove(burst));
          burst.controller.dispose();
        }
      })
      ..forward();

    setState(() => _bursts.add(burst));
  }

  void _onTapUp(TapUpDetails details) {
    _createBurst(details.localPosition);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapUp: _onTapUp,
      child: SizedBox.expand(
        child: ClipRect(
          child: CustomPaint(
            painter: const _GridPainter(),
            foregroundPainter: _BurstPainter(
              bursts: List.unmodifiable(_bursts),
            ),
          ),
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  const _GridPainter();

  static const _dotRadius = 1.5;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = _kGridColor
      ..style = PaintingStyle.fill;
    for (var x = _kGridSize; x < size.width; x += _kGridSize) {
      for (var y = _kGridSize; y < size.height; y += _kGridSize) {
        canvas.drawCircle(Offset(x, y), _dotRadius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) => false;
}

class _BurstPainter extends CustomPainter {
  const _BurstPainter({required this.bursts});

  final List<_Burst> bursts;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    for (final burst in bursts) {
      final t = burst.controller.value;
      // Cubic ease-out: particles spread quickly then slow down
      final eased = 1.0 - math.pow(1.0 - t, 3).toDouble();
      for (var i = 0; i < burst.angles.length; i++) {
        final distance = burst.radii[i] * eased;
        final center = burst.position +
            Offset(
              math.cos(burst.angles[i]) * distance,
              math.sin(burst.angles[i]) * distance,
            );
        final opacity = (1.0 - t).clamp(0.0, 1.0);
        final radius = burst.sizes[i] * (1.0 - t * 0.4);
        paint.color = burst.color.withValues(alpha: opacity);
        canvas.drawCircle(center, radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _BurstPainter oldDelegate) => true;
}
