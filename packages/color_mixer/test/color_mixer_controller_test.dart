import 'package:color_mixer/color_mixer.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ColorMixerController', () {
    ColorMixerController buildColorMixerController({
      Color? initialColor,
    }) {
      late final ColorMixerController controller;
      if (initialColor == null) {
        controller = ColorMixerController();
      } else {
        controller = ColorMixerController(color: initialColor);
      }
      addTearDown(() => controller.dispose());
      return controller;
    }

    group('defaults', () {
      test('color defaults to opaque black', () {
        final controller = buildColorMixerController();
        expect(controller.color, const Color(0xFF000000));
      });

      test('default color has alpha forced to 1', () {
        final controller = buildColorMixerController();
        expect(controller.color.a, 1.0);
      });
    });

    group('constructor alpha normalization', () {
      test('fully opaque color is accepted as-is', () {
        final controller = buildColorMixerController(
          initialColor: const Color(0xFFFF0000),
        );
        expect(controller.color, const Color(0xFFFF0000));
      });

      test('transparent color has alpha replaced with 1', () {
        final controller = buildColorMixerController(
          initialColor: const Color(0x00FF0000),
        );
        expect(controller.color, const Color(0xFFFF0000));
      });

      test('partial-alpha color has alpha forced to 1', () {
        final controller = buildColorMixerController(
          initialColor: const Color(0x8000FF00),
        );
        expect(controller.color, const Color(0xFF00FF00));
      });
    });

    group('setter alpha normalization', () {
      test('setting color with zero alpha forces alpha to 1', () {
        final controller = buildColorMixerController()
          ..color = const Color(0x000000FF);
        expect(controller.color, const Color(0xFF0000FF));
      });

      test('setting color with partial alpha forces alpha to 1', () {
        final controller = buildColorMixerController()
          ..color = const Color(0x40FF0000);
        expect(controller.color, const Color(0xFFFF0000));
      });

      test('setting fully opaque color is accepted as-is', () {
        final controller = buildColorMixerController()
          ..color = const Color(0xFF00FF00);
        expect(controller.color, const Color(0xFF00FF00));
      });
    });

    group('listener notification', () {
      test('notifies listeners when color changes', () {
        final controller = buildColorMixerController();
        var notified = false;
        controller
          ..addListener(() => notified = true)
          ..color = const Color(0xFFFF0000);
        expect(notified, isTrue);
      });

      test('does not notify after listener is removed', () {
        final controller = buildColorMixerController();
        var callCount = 0;
        void listener() => callCount++;
        controller
          ..addListener(listener)
          ..color = const Color(0xFFFF0000)
          ..removeListener(listener)
          ..color = const Color(0xFF00FF00);
        expect(callCount, 1);
      });

      test('notifies each time color changes', () {
        final controller = buildColorMixerController();
        var callCount = 0;
        controller
          ..addListener(() => callCount++)
          ..color = const Color(0xFFFF0000)
          ..color = const Color(0xFF00FF00)
          ..color = const Color(0xFF0000FF);
        expect(callCount, 3);
      });
    });
  });
}
