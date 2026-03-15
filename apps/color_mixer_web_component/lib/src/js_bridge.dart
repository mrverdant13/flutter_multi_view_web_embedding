import 'dart:js_interop';
import 'dart:ui' show FlutterView;
import 'dart:ui_web' as ui_web;

import 'package:color_mixer_web_component/src/color_mixer_view_controller.dart';
import 'package:web/web.dart' as web;

/// Wraps [controller] as a JS interop object and dispatches
/// `flutter::state_ready` on the view's host element.
void dispatchColorMixerApi(
  FlutterView view,
  ColorMixerViewController controller,
) {
  final hostElement =
      ui_web.views.getHostElement(view.viewId) as web.HTMLElement?;
  hostElement?.dispatchEvent(
    web.CustomEvent(
      'flutter::state_ready',
      web.CustomEventInit(
        detail: createJSInteropWrapper(controller),
        bubbles: false,
      ),
    ),
  );
}
