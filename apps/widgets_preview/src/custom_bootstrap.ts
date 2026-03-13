/** Internal Flutter app type. */
export interface FlutterApp {
  addView(options: { hostElement: HTMLElement }): Promise<number>;
  removeView(viewId: number): Promise<unknown>;
}

interface FlutterAppRunner {
  runApp(): Promise<FlutterApp>;
}

/** Internal Flutter engine initializer type. */
interface FlutterEngineInitializer {
  initializeEngine(options: {
    assetBase: string;
    multiViewEnabled: boolean;
  }): Promise<FlutterAppRunner>;
}

interface FlutterLoader {
  load(options: {
    config: { entryPointBaseUrl: string };
    onEntrypointLoaded: (initializer: FlutterEngineInitializer) => Promise<void>;
  }): void;
}

interface FlutterNamespace {
  loader: FlutterLoader;
}

/** The _flutter global injected by flutter_bootstrap.js. */
declare const _flutter: FlutterNamespace;

// Per-app promise cache keyed on `entryPointBaseUrl::assetBase`.
// Concurrent callers for the same key share one promise and never
// trigger a second load().
const appCache = new Map<string, Promise<FlutterApp>>();

// Serial queue: _flutter.loader.load() must never run concurrently across
// different entry points. Each new load chains onto this queue so it starts
// only after the previous one has fully completed (including runApp()).
let loadQueue: Promise<void> = Promise.resolve();

/**
 * Returns the running Flutter app for the given entry point and asset base,
 * initializing it on the first call.
 *
 * Load calls are serialized across all entry points. Concurrent calls for the
 * same `entryPointBaseUrl` + `assetBase` share one in-flight promise and never
 * trigger a second `load()`.
 *
 * @param entryPointBaseUrl  Base URL passed to `_flutter.loader.load()` config.
 * @param assetBase          Base URL passed to `engineInitializer.initializeEngine()`.
 */
export function getFlutterApp(
  entryPointBaseUrl: string,
  assetBase: string,
): Promise<FlutterApp> {
  const key = `${entryPointBaseUrl}::${assetBase}`;

  if (!appCache.has(key)) {
    // Chain onto the queue so this load() starts only after any in-flight
    // load() for another entry point has finished.
    // Both assignments are synchronous so concurrent callers see the updated
    // state immediately, before any await suspends this function.
    const asyncApp = loadQueue.then(
      async () => new Promise<FlutterApp>((resolve, reject) => {
        _flutter.loader.load({
          config: { entryPointBaseUrl },
          onEntrypointLoaded: async (engineInitializer) => {
            try {
              const appRunner = await engineInitializer.initializeEngine({
                assetBase,
                multiViewEnabled: true,
              });
              resolve(await appRunner.runApp());
            } catch (err) {
              reject(err);
            }
          },
        });
      }),
    );
    // Store before any await so concurrent callers find it immediately.
    appCache.set(key, asyncApp);
    // Advance the queue to wait for this entry point's full init before
    // allowing the next load() to start.
    loadQueue = asyncApp.then(() => undefined, () => undefined);
  }

  return appCache.get(key)!;
}
