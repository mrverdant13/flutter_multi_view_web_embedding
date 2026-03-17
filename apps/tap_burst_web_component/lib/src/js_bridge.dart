import 'dart:js_interop';
import 'dart:ui' show FlutterView;
import 'dart:ui_web' as ui_web;

import 'package:tap_burst_web_component/src/tap_burst_view.dart';
import 'package:tap_burst_web_component/src/tap_burst_view_controller.dart';
import 'package:web/web.dart' as web;

/// Wraps [controller] as a JS interop object and dispatches
/// `flutter::tap_burst::tap-burst-view-controller-ready` on the view's host
/// element.
void dispatchTapBurstApi(
  FlutterView view,
  TapBurstViewController controller,
) {
  final hostElement =
      ui_web.views.getHostElement(view.viewId) as web.HTMLElement?;
  hostElement?.dispatchEvent(
    web.CustomEvent(
      'flutter::${TapBurstView.widgetName}::tap-burst-view-controller-ready',
      web.CustomEventInit(
        detail: createJSInteropWrapper(controller),
        bubbles: false,
      ),
    ),
  );
}
