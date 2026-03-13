import 'package:flutter/widgets.dart';

void main() {
  runApp(const _App());
}

class _App extends StatelessWidget {
  const _App();

  @override
  Widget build(BuildContext context) {
    return WidgetsApp(
      color: const Color(0xFF000000),
      builder: (_, __) => const SizedBox.shrink(),
    );
  }
}
