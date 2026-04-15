// This package uses dart:js_interop and dart:ui_web, which are unavailable
// on the Dart VM. All substantive tests are annotated @TestOn('browser') and
// must run with --platform chrome.
//
// This file exists so that `flutter test --coverage` (VM) can find at least
// one test, exit 0, and produce an empty lcov report (no VM-reachable source
// lines = 100% coverage by convention).
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'placeholder test',
    () {
      expect(true, isTrue);
    },
  );
}
