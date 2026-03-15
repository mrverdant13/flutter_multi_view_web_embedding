part of 'color_mixer.dart';

/// Controls a [ColorMixer] widget.
class ColorMixerController extends ValueNotifier<Color> {
  /// Creates a [ColorMixerController].
  ColorMixerController({
    Color color = defaultColor,
  }) : super(color.asValidColor);

  /// The default color used when no initial color is provided.
  static const defaultColor = Color(0x00000000);

  /// The current color (alpha forced to 1.0).
  Color get color => value.asValidColor;
  set color(Color c) => value = c.asValidColor;
}

extension on Color {
  Color get asValidColor => withValues(alpha: 1);
}
