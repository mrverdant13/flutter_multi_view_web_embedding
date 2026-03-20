import 'package:flutter_test/flutter_test.dart';
import 'package:tap_burst/tap_burst.dart';

void main() {
  group('TapBurstController', () {
    group('defaults', () {
      test('particleCount defaults to $defaultParticleCount', () {
        final controller = TapBurstController();
        expect(
          controller.particleCount,
          TapBurstController.defaultParticleCount,
        );
        controller.dispose();
      });

      test('burstDuration defaults to $defaultBurstDuration', () {
        final controller = TapBurstController();
        expect(
          controller.burstDuration,
          TapBurstController.defaultBurstDuration,
        );
        controller.dispose();
      });
    });

    group('constructor clamping', () {
      test('particleCount below minimum is clamped to 1', () {
        final controller = TapBurstController(particleCount: 0);
        expect(controller.particleCount, 1);
        controller.dispose();
      });

      test('particleCount above maximum is clamped to 200', () {
        final controller = TapBurstController(particleCount: 500);
        expect(controller.particleCount, 200);
        controller.dispose();
      });

      test('particleCount within range is accepted as-is', () {
        final controller = TapBurstController(particleCount: 50);
        expect(controller.particleCount, 50);
        controller.dispose();
      });

      test('burstDuration below minimum is clamped to 100 ms', () {
        final controller = TapBurstController(
          burstDuration: const Duration(milliseconds: 10),
        );
        expect(controller.burstDuration, const Duration(milliseconds: 100));
        controller.dispose();
      });

      test('burstDuration above maximum is clamped to 5000 ms', () {
        final controller = TapBurstController(
          burstDuration: const Duration(seconds: 10),
        );
        expect(controller.burstDuration, const Duration(milliseconds: 5000));
        controller.dispose();
      });

      test('burstDuration within range is accepted as-is', () {
        final controller = TapBurstController(
          burstDuration: const Duration(milliseconds: 1000),
        );
        expect(controller.burstDuration, const Duration(milliseconds: 1000));
        controller.dispose();
      });
    });

    group('setter clamping', () {
      test('setting particleCount below 1 clamps to 1', () {
        final controller = TapBurstController()..particleCount = -5;
        expect(controller.particleCount, 1);
        controller.dispose();
      });

      test('setting particleCount above 200 clamps to 200', () {
        final controller = TapBurstController()..particleCount = 999;
        expect(controller.particleCount, 200);
        controller.dispose();
      });

      test('setting particleCount to boundary value 1 is accepted', () {
        final controller = TapBurstController()..particleCount = 1;
        expect(controller.particleCount, 1);
        controller.dispose();
      });

      test('setting particleCount to boundary value 200 is accepted', () {
        final controller = TapBurstController()..particleCount = 200;
        expect(controller.particleCount, 200);
        controller.dispose();
      });

      test('setting burstDuration below 100 ms clamps to 100 ms', () {
        final controller = TapBurstController()..burstDuration = Duration.zero;
        expect(controller.burstDuration, const Duration(milliseconds: 100));
        controller.dispose();
      });

      test('setting burstDuration above 5000 ms clamps to 5000 ms', () {
        final controller = TapBurstController()
          ..burstDuration = const Duration(hours: 1);
        expect(controller.burstDuration, const Duration(milliseconds: 5000));
        controller.dispose();
      });

      test('setting burstDuration to boundary value 100 ms is accepted', () {
        final controller = TapBurstController()
          ..burstDuration = const Duration(milliseconds: 100);
        expect(controller.burstDuration, const Duration(milliseconds: 100));
        controller.dispose();
      });

      test('setting burstDuration to boundary value 5000 ms is accepted', () {
        final controller = TapBurstController()
          ..burstDuration = const Duration(milliseconds: 5000);
        expect(controller.burstDuration, const Duration(milliseconds: 5000));
        controller.dispose();
      });
    });

    group('listener notification', () {
      test('notifies listeners when particleCount changes', () {
        final controller = TapBurstController();
        var notified = false;
        controller
          ..addListener(() => notified = true)
          ..particleCount = 20;
        expect(notified, isTrue);
        controller.dispose();
      });

      test('notifies listeners when burstDuration changes', () {
        final controller = TapBurstController();
        var notified = false;
        controller
          ..addListener(() => notified = true)
          ..burstDuration = const Duration(milliseconds: 500);
        expect(notified, isTrue);
        controller.dispose();
      });

      test('does not notify after listener is removed', () {
        final controller = TapBurstController();
        var callCount = 0;
        void listener() => callCount++;
        controller
          ..addListener(listener)
          ..particleCount = 20
          ..removeListener(listener)
          ..particleCount = 30;
        expect(callCount, 1);
        controller.dispose();
      });

      test('notifies each time a value changes', () {
        final controller = TapBurstController();
        var callCount = 0;
        controller
          ..addListener(() => callCount++)
          ..particleCount = 20
          ..particleCount = 30
          ..burstDuration = const Duration(milliseconds: 500);
        expect(callCount, 3);
        controller.dispose();
      });
    });
  });
}

const defaultParticleCount = TapBurstController.defaultParticleCount;
const defaultBurstDuration = TapBurstController.defaultBurstDuration;
