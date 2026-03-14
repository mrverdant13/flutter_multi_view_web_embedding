import 'dart:math' as math;

import 'package:flutter/widgets.dart';

const _kParticleCount = 10;
const _kBurstDuration = Duration(milliseconds: 800);
const _kBackground = Color(0xFF0D0D1A);
const _kGridColor = Color(0xFF1E1E30);
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
class TapBurst extends StatefulWidget {
  /// Creates a [TapBurst] widget.
  const TapBurst({super.key});

  @override
  State<TapBurst> createState() => _TapBurstState();
}

class _TapBurstState extends State<TapBurst> with TickerProviderStateMixin {
  final _bursts = <_Burst>[];
  final _random = math.Random();
  var _colorIndex = 0;

  @override
  void dispose() {
    for (final burst in _bursts) {
      burst.controller.dispose();
    }
    super.dispose();
  }

  void _onTapUp(TapUpDetails details) {
    final color = _kPalette[_colorIndex % _kPalette.length];
    _colorIndex++;

    final angles = List<double>.generate(_kParticleCount, (i) {
      final base = (i / _kParticleCount) * math.pi * 2;
      return base + (_random.nextDouble() - 0.5) * 0.7;
    });
    final radii = List<double>.generate(
      _kParticleCount,
      (_) => 50 + _random.nextDouble() * 45,
    );
    final sizes = List<double>.generate(
      _kParticleCount,
      (_) => 5 + _random.nextDouble() * 6,
    );

    final controller = AnimationController(
      vsync: this,
      duration: _kBurstDuration,
    );
    final burst = _Burst(
      position: details.localPosition,
      controller: controller,
      color: color,
      angles: angles,
      radii: radii,
      sizes: sizes,
    );

    controller
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

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapUp: _onTapUp,
      child: SizedBox.expand(
        child: ColoredBox(
          color: _kBackground,
          child: ClipRect(
            child: CustomPaint(
              painter: const _GridPainter(),
              foregroundPainter: _BurstPainter(
                bursts: List.unmodifiable(_bursts),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  const _GridPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = _kGridColor
      ..strokeWidth = 1;
    for (double x = 0; x <= size.width; x += _kGridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += _kGridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
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
