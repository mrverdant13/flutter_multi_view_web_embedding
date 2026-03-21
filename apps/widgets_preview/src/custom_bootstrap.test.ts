import { beforeEach, describe, expect, it, vi } from 'vitest';

type FlutterAppLike = {
  addView: (opts: unknown) => Promise<number>;
  removeView: (id: number) => Promise<void>;
};

function makeFlutterGlobal(app: FlutterAppLike) {
  return {
    loader: {
      load: vi.fn(
        ({
          onEntrypointLoaded,
        }: {
          onEntrypointLoaded: (init: object) => Promise<void>;
        }) =>
          onEntrypointLoaded({
            initializeEngine: () =>
              Promise.resolve({ runApp: () => Promise.resolve(app) }),
          }),
      ),
    },
  };
}

describe('getFlutterApp', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('resolves with the flutter app', async () => {
    const app: FlutterAppLike = { addView: vi.fn(), removeView: vi.fn() };
    vi.stubGlobal('_flutter', makeFlutterGlobal(app));
    const { getFlutterApp } = await import('./custom_bootstrap');

    await expect(getFlutterApp('/app/', '/app/')).resolves.toBe(app);
  });

  it('returns the same promise for identical args (cache hit)', async () => {
    const app: FlutterAppLike = { addView: vi.fn(), removeView: vi.fn() };
    vi.stubGlobal('_flutter', makeFlutterGlobal(app));
    const { getFlutterApp } = await import('./custom_bootstrap');

    const p1 = getFlutterApp('/app/', '/app/');
    const p2 = getFlutterApp('/app/', '/app/');
    expect(p1).toBe(p2);
    await p1;
  });

  it('returns different promises for different entry points', async () => {
    const app: FlutterAppLike = { addView: vi.fn(), removeView: vi.fn() };
    vi.stubGlobal('_flutter', makeFlutterGlobal(app));
    const { getFlutterApp } = await import('./custom_bootstrap');

    const p1 = getFlutterApp('/app1/', '/app1/');
    const p2 = getFlutterApp('/app2/', '/app2/');
    expect(p1).not.toBe(p2);
    await Promise.all([p1, p2]);
  });

  it('evicts the cache entry on failure so the next call retries', async () => {
    let callCount = 0;
    vi.stubGlobal('_flutter', {
      loader: {
        load: vi.fn(
          ({
            onEntrypointLoaded,
          }: {
            onEntrypointLoaded: (init: object) => Promise<void>;
          }) => {
            callCount++;
            if (callCount === 1) {
              return onEntrypointLoaded({
                initializeEngine: () =>
                  Promise.resolve({
                    runApp: () => Promise.reject(new Error('load failed')),
                  }),
              });
            }
            const app: FlutterAppLike = {
              addView: vi.fn(),
              removeView: vi.fn(),
            };
            return onEntrypointLoaded({
              initializeEngine: () =>
                Promise.resolve({ runApp: () => Promise.resolve(app) }),
            });
          },
        ),
      },
    });
    const { getFlutterApp } = await import('./custom_bootstrap');

    await expect(getFlutterApp('/app/', '/app/')).rejects.toThrow(
      'load failed',
    );
    await expect(getFlutterApp('/app/', '/app/')).resolves.toBeDefined();
    expect(callCount).toBe(2);
  });

  it('serializes loads so each entry point starts only after the previous completes', async () => {
    const order: string[] = [];
    vi.stubGlobal('_flutter', {
      loader: {
        load: vi.fn(
          ({
            config,
            onEntrypointLoaded,
          }: {
            config: { entryPointBaseUrl: string };
            onEntrypointLoaded: (init: object) => Promise<void>;
          }) => {
            const url = config.entryPointBaseUrl;
            order.push(`start:${url}`);
            return onEntrypointLoaded({
              initializeEngine: () =>
                Promise.resolve({
                  runApp: () => {
                    order.push(`done:${url}`);
                    const app: FlutterAppLike = {
                      addView: vi.fn(),
                      removeView: vi.fn(),
                    };
                    return Promise.resolve(app);
                  },
                }),
            });
          },
        ),
      },
    });
    const { getFlutterApp } = await import('./custom_bootstrap');

    const p1 = getFlutterApp('/app1/', '/app1/');
    const p2 = getFlutterApp('/app2/', '/app2/');
    await Promise.all([p1, p2]);

    expect(order).toEqual([
      'start:/app1/',
      'done:/app1/',
      'start:/app2/',
      'done:/app2/',
    ]);
  });
});
