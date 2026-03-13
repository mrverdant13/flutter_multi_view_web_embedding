import 'package:color_mixer/color_mixer.dart';
import 'package:flutter/widgets.dart';
import 'package:multi_view_app/multi_view_app.dart';

void main() {
  runWidget(
    MultiViewApp(
      viewBuilder: (_) => const ColorMixer(),
    ),
  );
}
