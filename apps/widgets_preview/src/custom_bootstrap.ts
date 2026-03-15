/** Options passed to {@link FlutterApp.addView}. */
type AddViewOptions = {
  /** The DOM element that will host the new Flutter view. */
  hostElement: HTMLElement;
  /** Arbitrary data passed to the Flutter view on startup. */
  initialData?: unknown;
}

/** A running Flutter application that supports multiple views. */
type FlutterApp = {
  /** Adds a new Flutter view inside the given host element. Resolves with the assigned view ID. */
  addView: (options: AddViewOptions) => Promise<number>;
  /** Removes the Flutter view with the given ID. */
  removeView: (viewId: number) => Promise<unknown>;
}

/** Returned by {@link FlutterEngineInitializer.initializeEngine}; used to start the app. */
type FlutterAppRunner = {
  /** Starts the Flutter application. Resolves with the running {@link FlutterApp}. */
  runApp: () => Promise<FlutterApp>;
}

/** Options passed to {@link FlutterEngineInitializer.initializeEngine}. */
type EngineInitializerOptions = {
  /** Base URL from which the engine will resolve Flutter assets. */
  assetBase: string;
  /** When `true`, the engine starts in multi-view mode instead of single-view mode. */
  multiViewEnabled: boolean;
}

/** Provided by the Flutter engine bootstrap; initializes the engine before the app runs. */
type FlutterEngineInitializer = {
  /** Initializes the Flutter engine with the given options. Resolves with a {@link FlutterAppRunner}. */
  initializeEngine: (options: EngineInitializerOptions) => Promise<FlutterAppRunner>;
}

/** Configuration object supplied to {@link FlutterLoader.load}. */
type EntryPointConfig = {
  /** Base URL of the Flutter app's entry point (e.g. the directory containing `main.dart.js`). */
  entryPointBaseUrl: string;
}

/** Options passed to {@link FlutterLoader.load}. */
type EntryPointLoaderCallbackOptions = {
  /** Static configuration for the entry point. */
  config: EntryPointConfig;
  /**
   * Callback invoked once the Flutter entry point script has been fetched and
   * evaluated. Receives the {@link FlutterEngineInitializer} that drives the
   * rest of the startup sequence.
   */
  onEntrypointLoaded: (engineInitializer: FlutterEngineInitializer) => Promise<void>;
}

/** The Flutter loader injected by `flutter_bootstrap.js`. */
type FlutterLoader = {
  /** Fetches and evaluates the Flutter app entry point, then invokes the provided callback. */
  load: (options: EntryPointLoaderCallbackOptions) => Promise<void>;
}

/** Shape of the `_flutter` global namespace injected by `flutter_bootstrap.js`. */
type FlutterNamespace = {
  /** The loader used to bootstrap a Flutter application. */
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
