import 'package:color_mixer/color_mixer.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ColorMixer', () {
    ColorMixerController buildColorMixerController({Color? color}) {
      final controller = color == null
          ? ColorMixerController()
          : ColorMixerController(color: color);
      addTearDown(controller.dispose);
      return controller;
    }

    Widget buildColorMixer({
      ColorMixerController? controller,
    }) {
      return Directionality(
        textDirection: TextDirection.ltr,
        child: SizedBox(
          width: 400,
          height: 600,
          child: ColorMixer(controller: controller),
        ),
      );
    }

    group('rendering', () {
      testWidgets('renders without an external controller', (tester) async {
        await tester.pumpWidget(buildColorMixer());
        expect(find.byType(ColorMixer), findsOneWidget);
      });

      testWidgets('renders with an external controller', (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer(controller: controller));
        expect(find.byType(ColorMixer), findsOneWidget);
      });
    });

    group('internal controller', () {
      testWidgets('creates an internal controller when none is provided',
          (tester) async {
        await tester.pumpWidget(buildColorMixer());
        // Drag the first slider to verify the internal controller is active.
        await tester.drag(
          find.byType(GestureDetector).first,
          const Offset(100, 0),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
      });

      testWidgets(
          'disposes internal controller when an external one is provided',
          (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer());

        // Switch to external controller — internal should be disposed cleanly.
        await tester.pumpWidget(buildColorMixer(controller: controller));
        expect(tester.takeException(), isNull);
      });

      testWidgets(
          'creates a new internal controller when external controller is '
          'removed', (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer(controller: controller));

        // Remove external controller — a new internal one should be created.
        await tester.pumpWidget(buildColorMixer());

        // Slider should still respond via the new internal controller.
        await tester.drag(
          find.byType(GestureDetector).first,
          const Offset(100, 0),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
      });
    });

    group('controller switching via didUpdateWidget', () {
      testWidgets('switches from one external controller to another',
          (tester) async {
        final controllerA = buildColorMixerController(
          color: const Color(0xFFFF0000),
        );
        final controllerB = buildColorMixerController(
          color: const Color(0xFF0000FF),
        );

        await tester.pumpWidget(buildColorMixer(controller: controllerA));
        await tester.pumpWidget(buildColorMixer(controller: controllerB));
        expect(tester.takeException(), isNull);
      });

      testWidgets('same controller instance triggers no rebuild side effects',
          (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer(controller: controller));

        // Pump same controller again — no change.
        await tester.pumpWidget(buildColorMixer(controller: controller));
        expect(tester.takeException(), isNull);
      });
    });

    group('hex display', () {
      testWidgets('shows hex code for the current controller color',
          (tester) async {
        final controller = buildColorMixerController(
          color: const Color(0xFFFF0000),
        );

        await tester.pumpWidget(buildColorMixer(controller: controller));

        expect(find.text('#FF0000', findRichText: true), findsOneWidget);
      });

      testWidgets('hex display updates when controller color changes',
          (tester) async {
        final controller = buildColorMixerController(
          color: const Color(0xFFFF0000),
        );

        await tester.pumpWidget(buildColorMixer(controller: controller));
        expect(find.text('#FF0000', findRichText: true), findsOneWidget);

        controller.color = const Color(0xFF0000FF);
        await tester.pump();

        expect(find.text('#0000FF', findRichText: true), findsOneWidget);
      });
    });

    group('slider interaction', () {
      testWidgets('dragging R slider updates the red channel', (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer(controller: controller));

        // R slider is the first GestureDetector; drag right to increase red.
        await tester.drag(
          find.byType(GestureDetector).at(0),
          const Offset(200, 0),
        );
        await tester.pump();

        expect(controller.color.r, greaterThan(0));
      });

      testWidgets('dragging G slider updates the green channel',
          (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer(controller: controller));

        // G slider is the second GestureDetector; drag right to increase green.
        await tester.drag(
          find.byType(GestureDetector).at(1),
          const Offset(200, 0),
        );
        await tester.pump();

        expect(controller.color.g, greaterThan(0));
      });

      testWidgets('dragging B slider updates the blue channel', (tester) async {
        final controller = buildColorMixerController();

        await tester.pumpWidget(buildColorMixer(controller: controller));

        // B slider is the third GestureDetector; drag right to increase blue.
        await tester.drag(
          find.byType(GestureDetector).at(2),
          const Offset(200, 0),
        );
        await tester.pump();

        expect(controller.color.b, greaterThan(0));
      });
    });

    group('painters', () {
      testWidgets('track painter shouldRepaint returns false for same values',
          (tester) async {
        await tester.pumpWidget(buildColorMixer());

        final painter =
            tester.widget<CustomPaint>(find.byType(CustomPaint).first).painter!;
        expect(painter.shouldRepaint(painter), isFalse);
      });
    });
  });
}
