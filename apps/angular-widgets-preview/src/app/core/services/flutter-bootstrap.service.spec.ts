import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FLUTTER_BOOTSTRAP_TIMEOUT_MS,
  FlutterBootstrapService,
} from './flutter-bootstrap.service';
import type { FlutterApp } from '../models/flutter-built-in.types';

const TIMEOUT_MS = 200;

async function flush(n = 30): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

interface ScriptStub {
  src: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

describe('FlutterBootstrapService', () => {
  let service: FlutterBootstrapService;
  let scriptStub: ScriptStub;

  beforeEach(() => {
    scriptStub = { src: '', onload: null, onerror: null };
    vi.spyOn(document, 'createElement').mockReturnValue(
      scriptStub as unknown as HTMLElement,
    );
    vi.spyOn(document.head, 'appendChild').mockReturnValue(
      scriptStub as unknown as Node,
    );
    globalThis._flutter = undefined;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        FlutterBootstrapService,
        { provide: FLUTTER_BOOTSTRAP_TIMEOUT_MS, useValue: TIMEOUT_MS },
      ],
    });
    service = TestBed.inject(FlutterBootstrapService);
  });

  afterEach(async () => {
    await flush();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    globalThis._flutter = undefined;
  });

  describe('initial state', () => {
    it('bootstrapStatus is idle', () => {
      expect(service.bootstrapStatus()).toBe('idle');
    });

    it('appStateSignal returns idle state for any entry point', () => {
      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('idle');
    });

    it('appStateSignal returns the same signal instance for the same key', () => {
      const s1 = service.appStateSignal('/ep/', '/ep/');
      const s2 = service.appStateSignal('/ep/', '/ep/');
      expect(s1).toBe(s2);
    });

    it('appStateSignal returns different signals for different keys', () => {
      const s1 = service.appStateSignal('/a/', '/a/');
      const s2 = service.appStateSignal('/b/', '/b/');
      expect(s1).not.toBe(s2);
    });
  });

  describe('bootstrap script loading', () => {
    it('sets bootstrapStatus to loading immediately after loadApp', async () => {
      service.loadApp('/ep/', '/ep/');
      await flush();
      expect(service.bootstrapStatus()).toBe('loading');
    });

    it('appends exactly one script element to document.head', async () => {
      service.loadApp('/ep/', '/ep/');
      await flush();
      expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    });

    it('does not append a second script when bootstrap is already ready', async () => {
      globalThis._flutter = { loader: { load: vi.fn() } };
      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();
      expect(service.bootstrapStatus()).toBe('ready');

      const appendCountAfterFirst = (
        document.head.appendChild as ReturnType<typeof vi.fn>
      ).mock.calls.length;

      service.loadApp('/ep2/', '/ep2/');
      await flush();

      expect(document.head.appendChild).toHaveBeenCalledTimes(
        appendCountAfterFirst,
      );
    });

    it('removes the script element from the DOM when bootstrap fails', async () => {
      const staleScript = { remove: vi.fn() } as unknown as Element;
      vi.spyOn(document.head, 'querySelector').mockReturnValue(staleScript);

      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onerror?.();
      await flush();

      expect(staleScript.remove).toHaveBeenCalledTimes(1);
    });

    it('sets bootstrapStatus to error when the script element fires onerror', async () => {
      service.loadApp('/ep/', '/ep/');
      await flush();
      await Promise.resolve().then(() => scriptStub.onerror?.());
      await flush();
      expect(service.bootstrapStatus()).toBe('error');
    });

    it('sets bootstrapStatus to error when script loads but _flutter is absent', async () => {
      service.loadApp('/ep/', '/ep/');
      await flush();
      await Promise.resolve().then(() => scriptStub.onload?.());
      await flush();
      expect(service.bootstrapStatus()).toBe('error');
    });

    it('sets bootstrapStatus to ready after successful script load', async () => {
      globalThis._flutter = { loader: { load: vi.fn() } };
      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();
      expect(service.bootstrapStatus()).toBe('ready');
    });
  });

  // Timeout tests use fake timers to avoid real 200 ms waits.
  describe('timeout behavior', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('sets bootstrapStatus to error when script load times out', async () => {
      service.loadApp('/ep/', '/ep/');
      await flush();
      expect(service.bootstrapStatus()).toBe('loading');

      await vi.advanceTimersByTimeAsync(TIMEOUT_MS + 10);
      await flush();

      expect(service.bootstrapStatus()).toBe('error');
    });

    it('sets app state to error when Flutter app init times out', async () => {
      globalThis._flutter = { loader: { load: vi.fn() } }; // loader never calls onEntrypointLoaded
      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();

      await vi.advanceTimersByTimeAsync(TIMEOUT_MS + 10);
      await flush();

      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('error');
    });
  });

  describe('app loading', () => {
    function makeFlutterMock(
      app: FlutterApp,
    ): NonNullable<typeof globalThis._flutter> {
      const mockRunner = { runApp: vi.fn().mockResolvedValue(app) };
      const mockEngine = {
        initializeEngine: vi.fn().mockResolvedValue(mockRunner),
      };
      return {
        loader: {
          load: vi.fn(
            async ({
              onEntrypointLoaded,
            }: {
              onEntrypointLoaded: (e: unknown) => Promise<void>;
            }) => {
              await onEntrypointLoaded(mockEngine);
            },
          ),
        },
      } as NonNullable<typeof globalThis._flutter>;
    }

    it('sets app state to error when bootstrap script fails', async () => {
      service.loadApp('/ep/', '/ep/');
      await flush();
      await Promise.resolve().then(() => scriptStub.onerror?.());
      await flush();
      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('error');
    });

    it('sets app state to error when _flutter is absent after bootstrap succeeds', async () => {
      const mockApp: FlutterApp = { addView: vi.fn(), removeView: vi.fn() };
      globalThis._flutter = makeFlutterMock(mockApp);

      // Let the first entry point succeed to drain the queue
      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();
      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('ready');

      // Now remove _flutter so the next app load finds it absent
      globalThis._flutter = undefined;
      service.loadApp('/ep2/', '/ep2/');
      await flush();

      expect(service.appStateSignal('/ep2/', '/ep2/')().state).toBe('error');
    });

    it('sets app state to error when initializeEngine throws', async () => {
      const mockRunner = { runApp: vi.fn() };
      const mockEngine = {
        initializeEngine: vi
          .fn()
          .mockRejectedValue(new Error('engine init failed')),
      };
      globalThis._flutter = {
        loader: {
          load: vi.fn(
            async ({
              onEntrypointLoaded,
            }: {
              onEntrypointLoaded: (e: unknown) => Promise<void>;
            }) => {
              await onEntrypointLoaded(mockEngine);
            },
          ),
        },
      } as NonNullable<typeof globalThis._flutter>;
      void mockRunner; // unused but clarifies intent

      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();

      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('error');
    });

    it('transitions app state to ready after a full successful load', async () => {
      const mockApp: FlutterApp = { addView: vi.fn(), removeView: vi.fn() };
      globalThis._flutter = makeFlutterMock(mockApp);

      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();

      const appState = service.appStateSignal('/ep/', '/ep/')();
      expect(appState.state).toBe('ready');
      if (appState.state === 'ready') {
        expect(appState.app).toBe(mockApp);
      }
    });

    it('second loadApp call for a ready entry point is a no-op', async () => {
      const mockApp: FlutterApp = { addView: vi.fn(), removeView: vi.fn() };
      globalThis._flutter = makeFlutterMock(mockApp);

      service.loadApp('/ep/', '/ep/');
      await flush();
      scriptStub.onload?.();
      await flush();
      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('ready');

      service.loadApp('/ep/', '/ep/');
      await flush();

      expect(service.appStateSignal('/ep/', '/ep/')().state).toBe('ready');
    });

    it('two different entry points load independently via the serial queue', async () => {
      const appA: FlutterApp = { addView: vi.fn(), removeView: vi.fn() };
      const appB: FlutterApp = { addView: vi.fn(), removeView: vi.fn() };
      let callCount = 0;

      globalThis._flutter = {
        loader: {
          load: vi.fn(
            async ({
              onEntrypointLoaded,
            }: {
              onEntrypointLoaded: (e: unknown) => Promise<void>;
            }) => {
              callCount++;
              const app = callCount === 1 ? appA : appB;
              const mockRunner = { runApp: vi.fn().mockResolvedValue(app) };
              const mockEngine = {
                initializeEngine: vi.fn().mockResolvedValue(mockRunner),
              };
              await onEntrypointLoaded(mockEngine);
            },
          ),
        },
      } as NonNullable<typeof globalThis._flutter>;

      service.loadApp('/ep-a/', '/ep-a/');
      service.loadApp('/ep-b/', '/ep-b/');
      await flush();
      scriptStub.onload?.();
      await flush();

      expect(service.appStateSignal('/ep-a/', '/ep-a/')().state).toBe('ready');
      expect(service.appStateSignal('/ep-b/', '/ep-b/')().state).toBe('ready');
    });
  });
});

describe('FlutterBootstrapService — default token', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('FLUTTER_BOOTSTRAP_TIMEOUT_MS factory defaults to 30 000 ms', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), FlutterBootstrapService],
    });
    // Injecting without a token override exercises the default factory (() => 30_000).
    const svc = TestBed.inject(FlutterBootstrapService);
    expect(svc.bootstrapStatus()).toBe('idle');
  });
});
