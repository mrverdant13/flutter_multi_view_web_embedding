import 'dart:ui_web' as ui_web;

import 'package:color_mixer/color_mixer.dart';
import 'package:color_mixer_web_component/src/color_mixer_view_controller.dart';
import 'package:color_mixer_web_component/src/initial_data.dart';
import 'package:color_mixer_web_component/src/js_bridge.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

/// Stateful entry-point widget for the Color Mixer web component.
class ColorMixerView extends StatefulWidget {
  /// Creates a [ColorMixerView].
  const ColorMixerView({
    super.key,
  });

  /// The widget name used to namespace custom events.
  static const widgetName = 'color_mixer';

  @override
  State<ColorMixerView> createState() => _ColorMixerViewState();
}

class _ColorMixerViewState extends State<ColorMixerView> {
  late final ColorMixerViewController _controller;
  ColorMixerInitialData? _lastInitialData;

  @override
  void initState() {
    super.initState();
    _controller = ColorMixerViewController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final view = View.of(context);
    final data =
        ui_web.views.getInitialData(view.viewId) as ColorMixerInitialData?;
    if (data?.r != _lastInitialData?.r ||
        data?.g != _lastInitialData?.g ||
        data?.b != _lastInitialData?.b) {
      _lastInitialData = data;
      _controller.setColor(data?.r ?? 0.0, data?.g ?? 0.0, data?.b ?? 0.0);
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        dispatchColorMixerApi(view, _controller);
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ColorMixer(controller: _controller);
  }
}
