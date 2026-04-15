// Tests require browser APIs (dart:js_interop). Run with --platform chrome.
@TestOn('browser')
library;

import 'dart:js_interop';

import 'package:color_mixer_web_component/src/color_mixer_view_controller.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('$ColorMixerViewController', () {
    ColorMixerViewController buildColorMixerViewController({
      Color? color,
    }) {
      final controller = color == null
          ? ColorMixerViewController()
          : ColorMixerViewController(color: color);
      addTearDown(controller.dispose);
      return controller;
    }

    group('defaults', () {
      test('color defaults to opaque black', () {
        final controller = buildColorMixerViewController();
        expect(controller.color, const Color(0xFF000000));
      });

      test('onColorChanged defaults to null', () {
        final controller = buildColorMixerViewController();
        expect(controller.onColorChanged, isNull);
      });
    });

    group('channel getters', () {
      test('r returns red channel of current color', () {
        final controller = buildColorMixerViewController()..setColor(0.5, 0, 0);
        expect(controller.r, closeTo(0.5, 0.001));
      });

      test('g returns green channel of current color', () {
        final controller = buildColorMixerViewController()..setColor(0, 0.5, 0);
        expect(controller.g, closeTo(0.5, 0.001));
      });

      test('b returns blue channel of current color', () {
        final controller = buildColorMixerViewController()..setColor(0, 0, 0.5);
        expect(controller.b, closeTo(0.5, 0.001));
      });
    });

    group('setColor', () {
      test('updates color with given RGB values', () {
        final controller = buildColorMixerViewController()
          ..setColor(0.2, 0.4, 0.6);
        expect(controller.r, closeTo(0.2, 0.001));
        expect(controller.g, closeTo(0.4, 0.001));
        expect(controller.b, closeTo(0.6, 0.001));
      });

      test('clamps r below 0 to 0', () {
        final controller = buildColorMixerViewController()
          ..setColor(-0.5, 0, 0);
        expect(controller.r, 0.0);
      });

      test('clamps r above 1 to 1', () {
        final controller = buildColorMixerViewController()..setColor(1.5, 0, 0);
        expect(controller.r, 1.0);
      });

      test('clamps g below 0 to 0', () {
        final controller = buildColorMixerViewController()
          ..setColor(0, -0.5, 0);
        expect(controller.g, 0.0);
      });

      test('clamps g above 1 to 1', () {
        final controller = buildColorMixerViewController()..setColor(0, 1.5, 0);
        expect(controller.g, 1.0);
      });

      test('clamps b below 0 to 0', () {
        final controller = buildColorMixerViewController()
          ..setColor(0, 0, -0.5);
        expect(controller.b, 0.0);
      });

      test('clamps b above 1 to 1', () {
        final controller = buildColorMixerViewController()..setColor(0, 0, 1.5);
        expect(controller.b, 1.0);
      });
    });

    group('listener notification', () {
      test('notifies listeners when color changes via setColor', () {
        final controller = buildColorMixerViewController();
        var notified = false;
        controller
          ..addListener(() => notified = true)
          ..setColor(0.5, 0.5, 0.5);
        expect(notified, isTrue);
      });

      test('notifies listeners each time color changes', () {
        final controller = buildColorMixerViewController();
        var callCount = 0;
        controller
          ..addListener(() => callCount++)
          ..setColor(1, 0, 0)
          ..setColor(0, 1, 0)
          ..setColor(0, 0, 1);
        expect(callCount, 3);
      });
    });

    group('onColorChanged', () {
      test('invokes onColorChanged callback when color changes', () {
        final controller = buildColorMixerViewController();
        var wasCalled = false;
        void callback() => wasCalled = true;
        controller
          ..onColorChanged = callback.toJS
          ..setColor(0.5, 0.5, 0.5);
        expect(wasCalled, isTrue);
      });

      test('dispose clears onColorChanged', () {
        final controller = ColorMixerViewController();
        void callback() {}
        controller
          ..onColorChanged = callback.toJS
          ..dispose();
        expect(controller.onColorChanged, isNull);
      });
    });
  });
}
