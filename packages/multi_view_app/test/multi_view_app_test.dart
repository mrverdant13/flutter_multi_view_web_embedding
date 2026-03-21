import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:multi_view_app/multi_view_app.dart';

void main() {
  group('$MultiViewApp', () {
    Widget buildMultiViewApp({required WidgetBuilder viewBuilder}) {
      return MultiViewApp(viewBuilder: viewBuilder);
    }

    group('rendering', () {
      testWidgets('renders without error', (tester) async {
        await tester.pumpWidget(
          buildMultiViewApp(viewBuilder: (_) => const SizedBox()),
          wrapWithView: false,
        );
        expect(tester.takeException(), isNull);
      });

      testWidgets('calls viewBuilder for the current view', (tester) async {
        var callCount = 0;
        await tester.pumpWidget(
          buildMultiViewApp(
            viewBuilder: (_) {
              callCount++;
              return const SizedBox();
            },
          ),
          wrapWithView: false,
        );
        expect(callCount, greaterThan(0));
      });
    });

    group('viewBuilder update', () {
      testWidgets('calls new viewBuilder after widget update', (tester) async {
        await tester.pumpWidget(
          buildMultiViewApp(viewBuilder: (_) => const SizedBox()),
          wrapWithView: false,
        );

        var newBuilderCalled = false;
        await tester.pumpWidget(
          buildMultiViewApp(
            viewBuilder: (_) {
              newBuilderCalled = true;
              return const SizedBox();
            },
          ),
          wrapWithView: false,
        );

        expect(newBuilderCalled, isTrue);
      });
    });

    group('metrics changes', () {
      testWidgets('handles didChangeMetrics without error', (tester) async {
        await tester.pumpWidget(
          buildMultiViewApp(viewBuilder: (_) => const SizedBox()),
          wrapWithView: false,
        );

        tester.binding.handleMetricsChanged();
        await tester.pump();

        expect(tester.takeException(), isNull);
      });
    });

    group('observer lifecycle', () {
      testWidgets('removes observer when disposed', (tester) async {
        await tester.pumpWidget(
          buildMultiViewApp(viewBuilder: (_) => const SizedBox()),
          wrapWithView: false,
        );

        // Replace with an empty tree to trigger dispose.
        await tester.pumpWidget(
          const ViewCollection(views: []),
          wrapWithView: false,
        );

        // If the observer were still registered, _updateViews would call
        // setState on the disposed state, throwing an error.
        tester.binding.handleMetricsChanged();
        await tester.pump();

        expect(tester.takeException(), isNull);
      });
    });
  });
}
