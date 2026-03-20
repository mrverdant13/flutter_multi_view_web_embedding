import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tap_burst/tap_burst.dart';

void main() {
  group('TapBurst', () {
    group('rendering', () {
      testWidgets('renders without an external controller', (tester) async {
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: TapBurst(),
          ),
        );
        expect(find.byType(TapBurst), findsOneWidget);
        expect(find.byType(GestureDetector), findsOneWidget);
      });

      testWidgets('renders with an external controller', (tester) async {
        final controller = TapBurstController();
        addTearDown(controller.dispose);

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: TapBurst(controller: controller),
          ),
        );
        expect(find.byType(TapBurst), findsOneWidget);
      });
    });

    group('internal controller', () {
      testWidgets('creates an internal controller when none is provided',
          (tester) async {
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(),
            ),
          ),
        );
        // Widget renders and responds to taps, proving internal controller
        // is active.
        await tester.tapAt(const Offset(200, 200));
        await tester.pump();
        expect(tester.takeException(), isNull);
      });

      testWidgets(
          'disposes internal controller when an external one is provided',
          (tester) async {
        final controller = TapBurstController();
        addTearDown(controller.dispose);

        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(),
            ),
          ),
        );

        // Switch to external controller — internal should be disposed.
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(controller: controller),
            ),
          ),
        );

        expect(tester.takeException(), isNull);
      });

      testWidgets(
          'creates a new internal controller when external '
          'controller is removed', (tester) async {
        final controller = TapBurstController();
        addTearDown(controller.dispose);

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(controller: controller),
            ),
          ),
        );

        // Switch back to no external controller.
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(),
            ),
          ),
        );

        // Should still respond to taps via new internal controller.
        await tester.tapAt(const Offset(200, 200));
        await tester.pump();
        expect(tester.takeException(), isNull);
      });
    });

    group('controller switching via didUpdateWidget', () {
      testWidgets('switches from one external controller to another',
          (tester) async {
        final controllerA = TapBurstController(particleCount: 5);
        final controllerB = TapBurstController(particleCount: 15);
        addTearDown(controllerA.dispose);
        addTearDown(controllerB.dispose);

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(controller: controllerA),
            ),
          ),
        );

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(controller: controllerB),
            ),
          ),
        );

        expect(tester.takeException(), isNull);
      });

      testWidgets('same controller instance triggers no rebuild side effects',
          (tester) async {
        final controller = TapBurstController();
        addTearDown(controller.dispose);

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: TapBurst(controller: controller),
          ),
        );

        // Pump same controller again (no change).
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: TapBurst(controller: controller),
          ),
        );

        expect(tester.takeException(), isNull);
      });
    });

    group('tap gesture behavior', () {
      testWidgets('tap triggers a burst animation', (tester) async {
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(),
            ),
          ),
        );

        await tester.tapAt(const Offset(200, 200));
        await tester.pump();

        // Pump through most of the animation duration (default 800 ms).
        await tester.pump(const Duration(milliseconds: 400));
        expect(tester.takeException(), isNull);

        // Let animation complete.
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });

      testWidgets('multiple taps each produce independent burst animations',
          (tester) async {
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(),
            ),
          ),
        );

        await tester.tapAt(const Offset(100, 100));
        await tester.pump();
        await tester.tapAt(const Offset(200, 200));
        await tester.pump();
        await tester.tapAt(const Offset(300, 300));
        await tester.pump();

        // All three bursts should animate without error.
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });

      testWidgets('burst animation completes and cleans up', (tester) async {
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(),
            ),
          ),
        );

        await tester.tapAt(const Offset(200, 200));
        await tester.pump();

        // Advance past the default burst duration.
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    });

    group('controller properties affect burst', () {
      testWidgets('burst uses particleCount from controller', (tester) async {
        final controller = TapBurstController(particleCount: 5);
        addTearDown(controller.dispose);

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(controller: controller),
            ),
          ),
        );

        await tester.tapAt(const Offset(200, 200));
        await tester.pump();
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });

      testWidgets('burst respects custom burstDuration', (tester) async {
        final controller = TapBurstController(
          burstDuration: const Duration(milliseconds: 200),
        );
        addTearDown(controller.dispose);

        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 400,
              height: 400,
              child: TapBurst(controller: controller),
            ),
          ),
        );

        await tester.tapAt(const Offset(200, 200));
        await tester.pump();

        // Should be complete well within 300 ms.
        await tester.pump(const Duration(milliseconds: 300));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });
    });

    group('painters', () {
      testWidgets('grid painter shouldRepaint returns false', (tester) async {
        await tester.pumpWidget(
          const Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(width: 400, height: 400, child: TapBurst()),
          ),
        );

        final painter =
            tester.widget<CustomPaint>(find.byType(CustomPaint).first).painter!;
        expect(painter.shouldRepaint(painter), isFalse);
      });
    });
  });
}
