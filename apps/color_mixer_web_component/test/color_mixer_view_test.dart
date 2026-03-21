// Tests require browser APIs (dart:js_interop, dart:ui_web).
// Run with --platform chrome.
@TestOn('browser')
library;

import 'package:color_mixer/color_mixer.dart';
import 'package:color_mixer_web_component/src/color_mixer_view.dart';
import 'package:color_mixer_web_component/src/color_mixer_view_controller.dart';
import 'package:color_mixer_web_component/src/js_bridge.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('$ColorMixerView', () {
    Widget buildColorMixerView() {
      return const Directionality(
        textDirection: TextDirection.ltr,
        child: SizedBox(
          width: 400,
          height: 600,
          child: ColorMixerView(),
        ),
      );
    }

    testWidgets('renders without error', (tester) async {
      await tester.pumpWidget(buildColorMixerView());
      expect(tester.takeException(), isNull);
    });

    testWidgets('renders ColorMixer widget', (tester) async {
      await tester.pumpWidget(buildColorMixerView());
      expect(find.byType(ColorMixer), findsOneWidget);
    });

    testWidgets('disposes without error', (tester) async {
      await tester.pumpWidget(buildColorMixerView());
      await tester.pumpWidget(const SizedBox());
      expect(tester.takeException(), isNull);
    });
  });

  group('dispatchColorMixerApi', () {
    testWidgets('does not throw when called with test view', (tester) async {
      final controller = ColorMixerViewController();
      addTearDown(controller.dispose);
      dispatchColorMixerApi(tester.view, controller);
      expect(tester.takeException(), isNull);
    });
  });
}
