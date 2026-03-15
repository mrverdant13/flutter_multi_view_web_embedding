import 'dart:js_interop';

import 'package:color_mixer/color_mixer.dart';
import 'package:flutter/painting.dart';

/// A [ColorMixerController] that also serves as the JS API object for web
/// embedding.
@JSExport()
class ColorMixerViewController extends ColorMixerController {
  /// Creates a [ColorMixerViewController].
  ColorMixerViewController({
    super.color = ColorMixerController.defaultColor,
  }) {
    addListener(_notifyJs);
  }

  /// Red channel of the current color (0.0–1.0).
  double get r => color.r;

  /// Green channel of the current color (0.0–1.0).
  double get g => color.g;

  /// Blue channel of the current color (0.0–1.0).
  double get b => color.b;

  /// JS callback invoked when the color changes.
  JSFunction? onColorChanged;

  /// Updates the current color from JS.
  void setColor(double r, double g, double b) {
    color = Color.from(alpha: 1, red: r, green: g, blue: b);
  }

  void _notifyJs() {
    onColorChanged?.callAsFunction(
      null,
      color.r.toJS,
      color.g.toJS,
      color.b.toJS,
    );
  }

  @override
  void dispose() {
    removeListener(_notifyJs);
    onColorChanged = null;
    super.dispose();
  }
}
