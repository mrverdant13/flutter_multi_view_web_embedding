// Tests require browser APIs (dart:js_interop). Run with --platform chrome.
@TestOn('browser')
library;

import 'dart:js_interop';

import 'package:flutter_test/flutter_test.dart';
import 'package:tap_burst/tap_burst.dart';
import 'package:tap_burst_web_component/src/tap_burst_view_controller.dart';

void main() {
  group('$TapBurstViewController', () {
    TapBurstViewController buildTapBurstViewController() {
      final controller = TapBurstViewController();
      addTearDown(controller.dispose);
      return controller;
    }

    group('defaults', () {
      test('particleCount defaults to defaultParticleCount', () {
        final controller = buildTapBurstViewController();
        expect(
          controller.particleCount,
          TapBurstController.defaultParticleCount,
        );
      });

      test('burstDurationMs returns default burst duration in ms', () {
        final controller = buildTapBurstViewController();
        expect(
          controller.burstDurationMs,
          TapBurstController.defaultBurstDuration.inMilliseconds,
        );
      });

      test('onParticleCountChanged defaults to null', () {
        final controller = buildTapBurstViewController();
        expect(controller.onParticleCountChanged, isNull);
      });

      test('onBurstDurationChanged defaults to null', () {
        final controller = buildTapBurstViewController();
        expect(controller.onBurstDurationChanged, isNull);
      });
    });

    group('particleCount', () {
      test('sets particle count', () {
        final controller = buildTapBurstViewController()..particleCount = 50;
        expect(controller.particleCount, 50);
      });

      test('clamps below 1 to 1', () {
        final controller = buildTapBurstViewController()..particleCount = 0;
        expect(controller.particleCount, 1);
      });

      test('clamps above 200 to 200', () {
        final controller = buildTapBurstViewController()..particleCount = 300;
        expect(controller.particleCount, 200);
      });
    });

    group('burstDurationMs', () {
      test('getter returns burst duration in milliseconds', () {
        final controller = buildTapBurstViewController()
          ..burstDurationMs = 1200;
        expect(controller.burstDurationMs, 1200);
      });

      test('setter updates burst duration', () {
        final controller = buildTapBurstViewController()
          ..burstDurationMs = 2000;
        expect(controller.burstDuration, const Duration(milliseconds: 2000));
      });

      test('clamps below 100 to 100', () {
        final controller = buildTapBurstViewController()..burstDurationMs = 50;
        expect(controller.burstDurationMs, 100);
      });

      test('clamps above 5000 to 5000', () {
        final controller = buildTapBurstViewController()
          ..burstDurationMs = 6000;
        expect(controller.burstDurationMs, 5000);
      });
    });

    group('listener notification', () {
      test('notifies listeners when particleCount changes', () {
        final controller = buildTapBurstViewController();
        var notified = false;
        controller
          ..addListener(() => notified = true)
          ..particleCount = 20;
        expect(notified, isTrue);
      });

      test('notifies listeners when burstDuration changes', () {
        final controller = buildTapBurstViewController();
        var notified = false;
        controller
          ..addListener(() => notified = true)
          ..burstDurationMs = 1000;
        expect(notified, isTrue);
      });
    });

    group('onParticleCountChanged', () {
      test('invokes onParticleCountChanged callback when particleCount changes',
          () {
        final controller = buildTapBurstViewController();
        var wasCalled = false;
        void callback() => wasCalled = true;
        controller
          ..onParticleCountChanged = callback.toJS
          ..particleCount = 20;
        expect(wasCalled, isTrue);
      });

      test('dispose clears onParticleCountChanged', () {
        final controller = TapBurstViewController();
        void callback() {}
        controller
          ..onParticleCountChanged = callback.toJS
          ..dispose();
        expect(controller.onParticleCountChanged, isNull);
      });
    });

    group('onBurstDurationChanged', () {
      test('invokes onBurstDurationChanged callback when burstDuration changes',
          () {
        final controller = buildTapBurstViewController();
        var wasCalled = false;
        void callback() => wasCalled = true;
        controller
          ..onBurstDurationChanged = callback.toJS
          ..burstDurationMs = 1000;
        expect(wasCalled, isTrue);
      });

      test('dispose clears onBurstDurationChanged', () {
        final controller = TapBurstViewController();
        void callback() {}
        controller
          ..onBurstDurationChanged = callback.toJS
          ..dispose();
        expect(controller.onBurstDurationChanged, isNull);
      });
    });
  });
}
