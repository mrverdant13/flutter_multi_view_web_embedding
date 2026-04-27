import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { FlutterApp } from '../models/flutter-built-in.types';

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error';

type BootstrapState =
  | { state: 'idle' }
  | { state: 'loading'; promise: Promise<void> }
  | { state: 'ready' }
  | { state: 'error' };

export type FlutterAppState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready'; app: FlutterApp }
  | { state: 'error' };

export const FLUTTER_BOOTSTRAP_TIMEOUT_MS = new InjectionToken<number>(
  'FLUTTER_BOOTSTRAP_TIMEOUT_MS',
  { providedIn: 'root', factory: () => 30_000 },
);

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  const { promise: timeout, reject } = Promise.withResolvers<never>();
  const timerId = setTimeout(
    () => reject(new Error(`[${LOG_TAG}] ${label} timed out after ${ms} ms.`)),
    ms,
  );
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

const LOG_TAG = 'flutter_bootstrap';
const BOOTSTRAP_SCRIPT_URL =
  '/flutter-packages/flutter-bootstrap/flutter_bootstrap.js';

@Injectable({ providedIn: 'root' })
export class FlutterBootstrapService {
  private readonly timeoutMs = inject(FLUTTER_BOOTSTRAP_TIMEOUT_MS);

  private readonly _bootstrapStatus = signal<BootstrapState>({ state: 'idle' });
  readonly bootstrapStatus: Signal<AsyncStatus> = computed(
    () => this._bootstrapStatus().state,
  );

  private readonly appStateSignals = new Map<
    string,
    WritableSignal<FlutterAppState>
  >();

  /**
   * Serial queue: _flutter.loader.load() must never run concurrently across
   * different entry points. Each new load chains onto this queue.
   */
  private loadQueue: Promise<void> = Promise.resolve();

  /**
   * Returns a read-only signal tracking the status of the app for the given
   * entry point. The signal is `'idle'` until the first `loadApp()` call and
   * automatically transitions through `'loading'` → `'ready'` | `'error'`.
   * When `'ready'`, the resolved `FlutterApp` is accessible as `.app`.
   */
  appStateSignal(
    entryPointBaseUrl: string,
    assetBaseUrl: string,
  ): Signal<FlutterAppState> {
    return this.getOrCreateAppStateSignal(
      `${entryPointBaseUrl}::${assetBaseUrl}`,
    ).asReadonly();
  }

  /**
   * Triggers loading of the Flutter app for the given entry point. Fire-and-forget;
   * observe `appStateSignal()` to react to state transitions.
   */
  loadApp(entryPointBaseUrl: string, assetBaseUrl: string): void {
    void this.doLoadApp(entryPointBaseUrl, assetBaseUrl);
  }

  private async doLoadApp(
    entryPointBaseUrl: string,
    assetBaseUrl: string,
  ): Promise<void> {
    const key = `${entryPointBaseUrl}::${assetBaseUrl}`;
    const appSig = this.getOrCreateAppStateSignal(key);

    try {
      await this.ensureBootstrap();
    } catch {
      appSig.set({ state: 'error' });
      return;
    }

    const current = appSig();
    if (current.state === 'ready' || current.state === 'loading') return;

    const promise = this.loadQueue.then(() => {
      const {
        promise: appPromise,
        resolve,
        reject,
      } = Promise.withResolvers<FlutterApp>();
      const flutter = globalThis._flutter;
      if (!flutter) {
        reject(new Error(`[${LOG_TAG}] Flutter loader is not available.`));
      } else {
        flutter.loader.load({
          config: { entryPointBaseUrl },
          onEntrypointLoaded: async (engineInitializer) => {
            performance.mark(`${LOG_TAG}::entrypoint_loaded`, {
              detail: { entryPointBaseUrl, assetBaseUrl },
            });
            try {
              const appRunner = await engineInitializer.initializeEngine({
                assetBase: assetBaseUrl,
                multiViewEnabled: true,
              });
              resolve(await appRunner.runApp());
            } catch (err) {
              reject(err);
            }
          },
        });
      }
      return withTimeout(appPromise, this.timeoutMs, `App init for "${key}"`);
    });

    // Mark loading before any await so concurrent callers see it immediately.
    appSig.set({ state: 'loading' });
    promise.then(
      (app) => {
        performance.mark(`${LOG_TAG}::app_ready`, {
          detail: { entryPointBaseUrl, assetBaseUrl },
        });
        appSig.set({ state: 'ready', app });
      },
      (err) => {
        console.error(`[${LOG_TAG}::${key}] Flutter app failed to load.`, err);
        appSig.set({ state: 'error' });
      },
    );
    // Advance the queue: the next entry point starts only after this one is done.
    this.loadQueue = promise.then(
      () => undefined,
      () => undefined,
    );
  }

  private getOrCreateAppStateSignal(
    key: string,
  ): WritableSignal<FlutterAppState> {
    const existing = this.appStateSignals.get(key);
    if (existing) return existing;
    const appSig = signal<FlutterAppState>({ state: 'idle' });
    this.appStateSignals.set(key, appSig);
    return appSig;
  }

  private ensureBootstrap(): Promise<void> {
    const current = this._bootstrapStatus();
    if (current.state === 'loading') return current.promise;
    if (current.state === 'ready') return Promise.resolve();

    const promise = withTimeout(
      this.loadBootstrapScript(),
      this.timeoutMs,
      'Script loading',
    );
    this._bootstrapStatus.set({ state: 'loading', promise });
    promise.then(
      () => this._bootstrapStatus.set({ state: 'ready' }),
      () => {
        document.head
          .querySelector(`script[src="${BOOTSTRAP_SCRIPT_URL}"]`)
          ?.remove();
        this._bootstrapStatus.set({ state: 'error' });
      },
    );
    return promise;
  }

  private loadBootstrapScript(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const el = document.createElement('script');
    el.src = BOOTSTRAP_SCRIPT_URL;
    el.onload = () => {
      if (!globalThis._flutter?.loader) {
        reject(
          new Error(
            `[${LOG_TAG}] Flutter loader absent after "${el.src}" loaded. Verify the bootstrap script is correct.`,
          ),
        );
        return;
      }
      performance.mark(`${LOG_TAG}::loader_ready`);
      resolve();
    };
    el.onerror = () => reject(new Error(`Failed to load "${el.src}".`));
    document.head.appendChild(el);
    return promise;
  }
}
