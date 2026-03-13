import 'package:flutter/widgets.dart';
import 'package:multi_view_app/multi_view_app.dart';
import 'package:tap_burst/tap_burst.dart';

void main() {
  runWidget(
    MultiViewApp(
      viewBuilder: (_) => const TapBurst(),
    ),
  );
}
