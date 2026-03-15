import 'package:color_mixer_web_component/src/color_mixer_view.dart';
import 'package:flutter/widgets.dart';
import 'package:multi_view_app/multi_view_app.dart';

void main() {
  runWidget(
    MultiViewApp(
      viewBuilder: (_) => const ColorMixerView(),
    ),
  );
}
