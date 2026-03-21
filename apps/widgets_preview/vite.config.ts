import { defineConfig } from 'vitest/config';

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
});
