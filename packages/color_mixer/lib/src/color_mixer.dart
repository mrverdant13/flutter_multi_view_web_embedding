import 'package:flutter/widgets.dart';

part 'color_mixer_controller.dart';

const _kTextColor = Color(0xFFE4D8BC);
const _kSubtextColor = Color(0xFF6A6043);
const _kThumbColor = Color(0xFFE4D8BC);
const _kThumbShadow = Color(0x66000000);

const _kPadding = 20.0;
const _kPreviewRadius = 16.0;
const _kSliderAreaHeight = 52.0;
const _kTrackHeight = 10.0;
const _kThumbRadius = 13.0;
const _kTrackRadius = Radius.circular(5);
const _kThumbBorderWidth = 2.5;
const _kShadowOffset = Offset(0, 2);

/// An interactive widget for mixing red, green, and blue color channels.
///
/// Drag the three gradient sliders to adjust each RGB channel. The resulting
/// color is displayed as a large preview swatch with its hex code.
///
/// This widget is self-contained and does not require a [WidgetsApp] ancestor.
///
/// Provide a [ColorMixerController] to drive the widget from outside or to
/// receive color-change callbacks. If omitted, an internal controller is used.
class ColorMixer extends StatefulWidget {
  /// Creates a [ColorMixer] widget.
  const ColorMixer({
    super.key,
    this.controller,
  });

  /// Optional controller for programmatic control and callback binding.
  final ColorMixerController? controller;

  @override
  State<ColorMixer> createState() => _ColorMixerState();
}

class _ColorMixerState extends State<ColorMixer> {
  ColorMixerController? _internalController;

  ColorMixerController get _controller =>
      widget.controller ?? _internalController!;

  @override
  void initState() {
    super.initState();
    if (widget.controller == null) {
      _internalController = ColorMixerController();
    }
  }

  @override
  void didUpdateWidget(ColorMixer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      if (widget.controller == null) {
        _internalController ??= ColorMixerController();
      } else {
        _internalController?.dispose();
        _internalController = null;
      }
    }
  }

  @override
  void dispose() {
    _internalController?.dispose();
    _internalController = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Color>(
      valueListenable: _controller,
      builder: (context, color, _) {
        final r = color.r;
        final g = color.g;
        final b = color.b;
        final rInt = (r * 255).round();
        final gInt = (g * 255).round();
        final bInt = (b * 255).round();

        final rHex = rInt.toRadixString(16).padLeft(2, '0');
        final gHex = gInt.toRadixString(16).padLeft(2, '0');
        final bHex = bInt.toRadixString(16).padLeft(2, '0');
        final hex = '#$rHex$gHex$bHex'.toUpperCase();

        return Padding(
          padding: const EdgeInsets.all(_kPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Color preview swatch
              Expanded(
                flex: 5,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(_kPreviewRadius),
                  child: ColoredBox(
                    color: color,
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Hex code
              RichText(
                textDirection: TextDirection.ltr,
                textAlign: TextAlign.center,
                text: TextSpan(
                  text: hex,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 3,
                    color: _kTextColor,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // R slider
              _ColorSlider(
                channel: 'R',
                value: r,
                fromColor: Color.fromRGBO(0, gInt, bInt, 1),
                toColor: Color.fromRGBO(255, gInt, bInt, 1),
                onChanged: (v) => _controller.color =
                    Color.from(alpha: 1, red: v, green: g, blue: b),
              ),
              const SizedBox(height: 10),

              // G slider
              _ColorSlider(
                channel: 'G',
                value: g,
                fromColor: Color.fromRGBO(rInt, 0, bInt, 1),
                toColor: Color.fromRGBO(rInt, 255, bInt, 1),
                onChanged: (v) => _controller.color =
                    Color.from(alpha: 1, red: r, green: v, blue: b),
              ),
              const SizedBox(height: 10),

              // B slider
              _ColorSlider(
                channel: 'B',
                value: b,
                fromColor: Color.fromRGBO(rInt, gInt, 0, 1),
                toColor: Color.fromRGBO(rInt, gInt, 255, 1),
                onChanged: (v) => _controller.color =
                    Color.from(alpha: 1, red: r, green: g, blue: v),
              ),
              const SizedBox(height: 4),
            ],
          ),
        );
      },
    );
  }
}

class _ColorSlider extends StatelessWidget {
  const _ColorSlider({
    required this.channel,
    required this.value,
    required this.fromColor,
    required this.toColor,
    required this.onChanged,
  });

  final String channel;
  final double value;
  final Color fromColor;
  final Color toColor;
  final ValueChanged<double> onChanged;

  static const _labelWidth = 16.0;
  static const _valueWidth = 36.0;
  static const _gap = 10.0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: _kSliderAreaHeight,
      child: Row(
        textDirection: TextDirection.ltr,
        children: [
          // Channel label
          SizedBox(
            width: _labelWidth,
            child: RichText(
              textDirection: TextDirection.ltr,
              text: TextSpan(
                text: channel,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: _kSubtextColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: _gap),

          // Draggable slider track
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return GestureDetector(
                  onPanDown: (details) => onChanged(
                    (details.localPosition.dx / constraints.maxWidth)
                        .clamp(0.0, 1.0),
                  ),
                  onPanUpdate: (details) => onChanged(
                    (details.localPosition.dx / constraints.maxWidth)
                        .clamp(0.0, 1.0),
                  ),
                  child: SizedBox(
                    height: _kSliderAreaHeight,
                    child: CustomPaint(
                      painter: _TrackPainter(
                        value: value,
                        fromColor: fromColor,
                        toColor: toColor,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: _gap),

          // Numeric value label
          SizedBox(
            width: _valueWidth,
            child: RichText(
              textDirection: TextDirection.ltr,
              textAlign: TextAlign.right,
              text: TextSpan(
                text: '${(value * 255).round()}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: _kSubtextColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrackPainter extends CustomPainter {
  const _TrackPainter({
    required this.value,
    required this.fromColor,
    required this.toColor,
  });

  final double value;
  final Color fromColor;
  final Color toColor;

  @override
  void paint(Canvas canvas, Size size) {
    final centerY = size.height / 2;
    const trackLeft = _kThumbRadius;
    final trackWidth = size.width - _kThumbRadius * 2;
    final trackRect = Rect.fromLTWH(
      trackLeft,
      centerY - _kTrackHeight / 2,
      trackWidth,
      _kTrackHeight,
    );

    final thumbX = trackLeft + value * trackWidth;
    final thumbCenter = Offset(thumbX, centerY);

    canvas
      // Gradient track
      ..drawRRect(
        RRect.fromRectAndRadius(trackRect, _kTrackRadius),
        Paint()
          ..shader = LinearGradient(
            colors: [fromColor, toColor],
          ).createShader(trackRect),
      )
      // Drop shadow
      ..drawCircle(
        thumbCenter + _kShadowOffset,
        _kThumbRadius,
        Paint()..color = _kThumbShadow,
      )
      // White fill
      ..drawCircle(
        thumbCenter,
        _kThumbRadius,
        Paint()..color = _kThumbColor,
      )
      // Colored border matching current gradient position
      ..drawCircle(
        thumbCenter,
        _kThumbRadius - _kThumbBorderWidth / 2,
        Paint()
          ..color = Color.lerp(fromColor, toColor, value) ?? fromColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = _kThumbBorderWidth,
      );
  }

  @override
  bool shouldRepaint(covariant _TrackPainter oldDelegate) =>
      value != oldDelegate.value ||
      fromColor != oldDelegate.fromColor ||
      toColor != oldDelegate.toColor;
}
