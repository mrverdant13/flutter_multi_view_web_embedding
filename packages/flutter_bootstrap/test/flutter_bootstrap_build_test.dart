import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group(
    'flutter_bootstrap build artifact',
    () {
      final artifactFile = File(
        '${Directory.current.path}/build/web/flutter_bootstrap.js',
      );

      setUpAll(() async {
        final result = await Process.run(
          'flutter',
          ['build', 'web'],
          runInShell: true,
        );
        expect(
          result.exitCode,
          0,
          reason: 'flutter build web failed:\n${result.stderr}',
        );
      });

      test('artifact file exists after build', () {
        expect(artifactFile.existsSync(), isTrue);
      });

      test('template placeholders are replaced', () {
        final content = artifactFile.readAsStringSync();
        expect(content, isNot(contains('{{flutter_js}}')));
        expect(content, isNot(contains('{{flutter_build_config}}')));
      });

      test('exposes _flutter.loader', () {
        final content = artifactFile.readAsStringSync();
        expect(content, contains('_flutter.loader'));
      });
    },
  );
}
