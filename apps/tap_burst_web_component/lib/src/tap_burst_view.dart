import 'dart:ui_web' as ui_web;

import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';
import 'package:tap_burst/tap_burst.dart';
import 'package:tap_burst_web_component/src/initial_data.dart';
import 'package:tap_burst_web_component/src/js_bridge.dart';
import 'package:tap_burst_web_component/src/tap_burst_view_controller.dart';

/// Stateful entry-point widget for the Tap Burst web component.
class TapBurstView extends StatefulWidget {
  /// Creates a [TapBurstView].
  const TapBurstView({super.key});

  /// The unique widget name used to namespace custom events.
  static const widgetName = 'tap_burst';

  @override
  State<TapBurstView> createState() => _TapBurstViewState();
}

class _TapBurstViewState extends State<TapBurstView> {
  late final TapBurstViewController _controller;
  TapBurstInitialData? _lastInitialData;

  @override
  void initState() {
    super.initState();
    _controller = TapBurstViewController();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final view = View.of(context);
    final data =
        ui_web.views.getInitialData(view.viewId) as TapBurstInitialData?;
    if (data?.particleCount != _lastInitialData?.particleCount ||
        data?.burstDurationMs != _lastInitialData?.burstDurationMs) {
      _lastInitialData = data;
      _controller
        ..particleCount = data?.particleCount ?? 0
        ..burstDurationMs = data?.burstDurationMs ?? 0;
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        dispatchTapBurstApi(view, _controller);
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
    return TapBurst(controller: _controller);
  }
}
