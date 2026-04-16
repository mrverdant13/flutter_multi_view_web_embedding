import { createReadStream, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

/** Flutter packages served as raw static assets, bypassing Vite's transform pipeline. */
const FLUTTER_PACKAGES = [
  'flutter-bootstrap',
  'tap-burst-web-component',
  'color-mixer-web-component',
];

const CONTENT_TYPES: Record<string, string> = {
  js: 'application/javascript',
  wasm: 'application/wasm',
  json: 'application/json',
};

export default defineConfig({
  server: {
    port: 3000,
    open: !process.env.CI,
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/vite-env.d.ts'],
    },
  },
  plugins: [
    {
      // Serve Flutter package assets directly, before Vite's transform middleware.
      // dart2js output contains dynamic import() calls that trigger Vite's
      // importAnalysis to inject `import {injectQuery} from "/@vite/client"`,
      // which breaks classic-script loading used by the Flutter bootstrap.
      name: 'flutter-static-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = (req.url ?? '').split('?')[0];
          const isFlutterPkg = FLUTTER_PACKAGES.some(
            (pkg) => pathname.startsWith(`/node_modules/${pkg}/`),
          );
          if (!isFlutterPkg) return next();
          const filepath = join(process.cwd(), pathname);
          if (!existsSync(filepath) || !statSync(filepath).isFile()) return next();
          const ext = pathname.split('.').pop() ?? '';
          res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
          createReadStream(filepath).pipe(res);
        });
      },
    },
  ],
});
