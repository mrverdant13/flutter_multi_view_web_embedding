/** Data corresponding to a Flutter view.
 *
 * Passed to {@link FlutterApp.addView}.
 * Returned by {@link FlutterApp.removeView}.
 */
export interface FlutterViewData {
  /** The host DOM element for the Flutter view. */
  hostElement: HTMLElement;
  /** Arbitrary data forwarded to the Flutter widget via `ui_web.views.getInitialData()` on startup. */
  initialData: unknown;
}

/** A running Flutter application that supports multiple independent views. */
export interface FlutterApp {
  /** Attaches a new Flutter view inside the given host element. Resolves with the assigned view ID. */
  addView: (options: FlutterViewData) => Promise<number>;
  /** Detaches the Flutter view with the given ID from the DOM. */
  removeView: (viewId: number) => FlutterViewData;
}

/** Returned by {@link FlutterEngineInitializer.initializeEngine}; used to start the app. */
interface FlutterAppRunner {
  /** Starts the Flutter application. Resolves with the running {@link FlutterApp}. */
  runApp: () => Promise<FlutterApp>;
}

/** Options passed to {@link FlutterEngineInitializer.initializeEngine}. */
interface InitializeEngineOptions {
  /** Base URL from which the engine will resolve Flutter assets. */
  assetBase: string;
  /** When `true`, the engine starts in multi-view mode instead of single-view mode. */
  multiViewEnabled: boolean;
}

/** Provided by the Flutter engine bootstrap; initializes the engine before the app runs. */
interface FlutterEngineInitializer {
  /** Initializes the Flutter engine with the given options. Resolves with a {@link FlutterAppRunner}. */
  initializeEngine: (
    options: InitializeEngineOptions,
  ) => Promise<FlutterAppRunner>;
}

/** Configuration object supplied to {@link FlutterEntryPointLoader.load}. */
interface EntryPointConfig {
  /** Base URL of the Flutter app's entry point (e.g. the directory containing `main.dart.js`). */
  entryPointBaseUrl: string;
}

/** Options passed to {@link FlutterEntryPointLoader.load}. */
interface LoadEntryPointOptions {
  /** Static configuration for the entry point. */
  config: EntryPointConfig;
  /**
   * Callback invoked once the Flutter entry point script has been fetched and
   * evaluated. Receives the {@link FlutterEngineInitializer} that drives the
   * rest of the startup sequence.
   */
  onEntrypointLoaded: (
    engineInitializer: FlutterEngineInitializer,
  ) => Promise<void>;
}

/** The Flutter loader injected by `flutter_bootstrap.js`. */
interface FlutterEntryPointLoader {
  /** Fetches and evaluates the Flutter app entry point, then invokes the provided callback. */
  load: (options: LoadEntryPointOptions) => Promise<void>;
}

/** Shape of the `_flutter` global namespace injected by `flutter_bootstrap.js`. */
interface FlutterNamespace {
  /** The loader used to bootstrap a Flutter application. */
  loader: FlutterEntryPointLoader;
}

declare global {
  var _flutter: FlutterNamespace | undefined;
}
