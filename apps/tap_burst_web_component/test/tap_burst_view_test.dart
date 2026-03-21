// Tests require browser APIs (dart:js_interop, dart:ui_web).
// Run with --platform chrome.
@TestOn('browser')
library;

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tap_burst/tap_burst.dart';
import 'package:tap_burst_web_component/src/js_bridge.dart';
import 'package:tap_burst_web_component/src/tap_burst_view.dart';
import 'package:tap_burst_web_component/src/tap_burst_view_controller.dart';

void main() {
  group('$TapBurstView', () {
    Widget buildTapBurstView() {
      return const Directionality(
        textDirection: TextDirection.ltr,
        child: SizedBox(
          width: 400,
          height: 600,
          child: TapBurstView(),
        ),
      );
    }

    testWidgets('renders without error', (tester) async {
      await tester.pumpWidget(buildTapBurstView());
      expect(tester.takeException(), isNull);
    });

    testWidgets('renders TapBurst widget', (tester) async {
      await tester.pumpWidget(buildTapBurstView());
      expect(find.byType(TapBurst), findsOneWidget);
    });

    testWidgets('disposes without error', (tester) async {
      await tester.pumpWidget(buildTapBurstView());
      await tester.pumpWidget(const SizedBox());
      expect(tester.takeException(), isNull);
    });
  });

  group('dispatchTapBurstApi', () {
    testWidgets('does not throw when called with test view', (tester) async {
      final controller = TapBurstViewController();
      addTearDown(controller.dispose);
      dispatchTapBurstApi(tester.view, controller);
      expect(tester.takeException(), isNull);
    });
  });
}
