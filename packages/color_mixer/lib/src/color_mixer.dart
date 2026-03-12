import 'package:flutter/widgets.dart';

const _kBackground = Color(0xFFF0F0F5);
const _kTextColor = Color(0xFF2C2C3A);
const _kSubtextColor = Color(0xFF8888A0);
const _kThumbColor = Color(0xFFFFFFFF);
const _kThumbShadow = Color(0x33000000);

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
class ColorMixer extends StatefulWidget {
  /// Creates a [ColorMixer] widget.
  const ColorMixer({super.key});

  @override
  State<ColorMixer> createState() => _ColorMixerState();
}

class _ColorMixerState extends State<ColorMixer> {
  var _r = 0.20;
  var _g = 0.60;
  var _b = 1.00;

  Color get _color => Color.fromRGBO(
        (_r * 255).round(),
        (_g * 255).round(),
        (_b * 255).round(),
        1,
      );

  String get _hex {
    final r = (_r * 255).round().toRadixString(16).padLeft(2, '0');
    final g = (_g * 255).round().toRadixString(16).padLeft(2, '0');
    final b = (_b * 255).round().toRadixString(16).padLeft(2, '0');
    return '#$r$g$b'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final rInt = (_r * 255).round();
    final gInt = (_g * 255).round();
    final bInt = (_b * 255).round();

    return ColoredBox(
      color: _kBackground,
      child: Padding(
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
                  color: _color,
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
                text: _hex,
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
              value: _r,
              fromColor: Color.fromRGBO(0, gInt, bInt, 1),
              toColor: Color.fromRGBO(255, gInt, bInt, 1),
              onChanged: (v) => setState(() => _r = v),
            ),
            const SizedBox(height: 10),

            // G slider
            _ColorSlider(
              channel: 'G',
              value: _g,
              fromColor: Color.fromRGBO(rInt, 0, bInt, 1),
              toColor: Color.fromRGBO(rInt, 255, bInt, 1),
              onChanged: (v) => setState(() => _g = v),
            ),
            const SizedBox(height: 10),

            // B slider
            _ColorSlider(
              channel: 'B',
              value: _b,
              fromColor: Color.fromRGBO(rInt, gInt, 0, 1),
              toColor: Color.fromRGBO(rInt, gInt, 255, 1),
              onChanged: (v) => setState(() => _b = v),
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
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
