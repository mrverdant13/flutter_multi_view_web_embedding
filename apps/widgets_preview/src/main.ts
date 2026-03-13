import { getFlutterApp } from './custom_bootstrap';

/**
 * Dynamically loads a script by URL.
 * Rejects if the script fails to load.
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () =>
      reject(
        new Error(
          `Failed to load "${src}".\n` +
          'Run "npm run prestart" or "npm run prebuild" to generate Flutter assets.',
        ),
      );
    document.head.appendChild(el);
  });
}

/**
 * Mounts a Flutter multi-view widget into its host element.
 * @param basePath  Base URL for both the entry point and assets (e.g. `/tap-burst/`).
 * @param hostId    DOM element ID of the host container (e.g. `tap-burst-host`).
 */
async function mountWidget(basePath: string, hostId: string): Promise<void> {
  const host = document.getElementById(hostId);
  if (!host) throw new Error(`Host element #${hostId} not found.`);
  const app = await getFlutterApp(basePath, basePath);
  await app.addView({ hostElement: host });
}

/** Displays an error message inside a single Flutter host element. */
function showError(hostId: string, message: string): void {
  const el = document.getElementById(hostId);
  if (!el) return;
  Object.assign(el.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    color: '#6b6b88',
    fontSize: '0.85rem',
    textAlign: 'center',
  });
  el.textContent = message;
}

async function main(): Promise<void> {
  // Load the shared Flutter engine loader once before mounting any widget.
  await loadScript('/flutter-bootstrap/flutter_bootstrap.js');
  await Promise.all([
    mountWidget('/tap-burst/', 'tap-burst-host').catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[widgets-preview] tap-burst-host:', message);
      showError('tap-burst-host', message);
    }),
    mountWidget('/color-mixer/', 'color-mixer-host').catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[widgets-preview] color-mixer-host:', message);
      showError('color-mixer-host', message);
    }),
  ]);
}

main().catch((err: unknown) => {
  console.error('[widgets-preview]', err);
});
