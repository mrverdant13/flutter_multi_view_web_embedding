import 'package:flutter/widgets.dart';
import 'package:multi_view_app/multi_view_app.dart';
import 'package:tap_burst_web_component/src/tap_burst_view.dart';

void main() {
  runWidget(
    MultiViewApp(
      viewBuilder: (_) => const TapBurstView(),
    ),
  );
}
