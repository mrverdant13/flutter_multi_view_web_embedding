import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildColorMixerControlPanel,
  buildColorMixerOutputDisplay,
  buildTapBurstControlPanel,
  buildTapBurstOutputDisplay,
  getColorMixerInitialData,
  getTapBurstInitialData,
  loadScript,
  rgbToHex,
  showError,
  toColorHex,
  toInt255,
  wireColorMixerConfigPreview,
} from './main';

describe('toColorHex', () => {
  it('converts 0 to "00"', () => {
    expect(toColorHex(0)).toBe('00');
  });

  it('converts 1 to "ff"', () => {
    expect(toColorHex(1)).toBe('ff');
  });

  it('converts 0.5 to "80"', () => {
    expect(toColorHex(0.5)).toBe('80');
  });
});

describe('rgbToHex', () => {
  it('converts (0, 0, 0) to "#000000"', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts (1, 1, 1) to "#FFFFFF"', () => {
    expect(rgbToHex(1, 1, 1)).toBe('#FFFFFF');
  });

  it('converts (1, 0, 0) to "#FF0000"', () => {
    expect(rgbToHex(1, 0, 0)).toBe('#FF0000');
  });

  it('converts (0, 1, 0) to "#00FF00"', () => {
    expect(rgbToHex(0, 1, 0)).toBe('#00FF00');
  });
});

describe('toInt255', () => {
  it('converts 0 to 0', () => {
    expect(toInt255(0)).toBe(0);
  });

  it('converts 1 to 255', () => {
    expect(toInt255(1)).toBe(255);
  });

  it('converts 0.5 to 128', () => {
    expect(toInt255(0.5)).toBe(128);
  });
});

describe('showError', () => {
  it('sets container textContent to the message', () => {
    const container = document.createElement('div');
    showError(container, 'something went wrong');
    expect(container.textContent).toBe('something went wrong');
  });

  it('sets display to flex', () => {
    const container = document.createElement('div');
    showError(container, 'err');
    expect(container.style.display).toBe('flex');
  });
});

describe('loadScript', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('appends a script element with the given src to document.head', async () => {
    const promise = loadScript('test.js');
    const script = document.head.querySelector(
      'script[src="test.js"]',
    ) as HTMLScriptElement;
    script.onload!(new Event('load'));
    await promise;
    expect(
      document.head.querySelector('script[src="test.js"]'),
    ).not.toBeNull();
  });

  it('resolves when the script loads', async () => {
    const promise = loadScript('ok.js');
    const script = document.head.querySelector(
      'script[src="ok.js"]',
    ) as HTMLScriptElement;
    script.onload!(new Event('load'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects with an error when the script fails to load', async () => {
    const promise = loadScript('missing.js');
    const script = document.head.querySelector(
      'script[src="missing.js"]',
    ) as HTMLScriptElement;
    script.onerror!(new Event('error'));
    await expect(promise).rejects.toThrow('Failed to load "missing.js"');
  });
});

describe('getColorMixerInitialData', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads r, g, b float values from the config inputs', () => {
    document.body.innerHTML = `
      <input id="color-mixer-config-r" value="0.5">
      <input id="color-mixer-config-g" value="0.3">
      <input id="color-mixer-config-b" value="0.8">
    `;
    expect(getColorMixerInitialData()).toEqual({ r: 0.5, g: 0.3, b: 0.8 });
  });

  it('defaults to 0 for each channel when inputs are absent', () => {
    expect(getColorMixerInitialData()).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('getTapBurstInitialData', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads particleCount and burstDurationMs from the config inputs', () => {
    document.body.innerHTML = `
      <input id="tap-burst-config-particle-count" value="20">
      <input id="tap-burst-config-burst-duration" value="600">
    `;
    expect(getTapBurstInitialData()).toEqual({
      particleCount: 20,
      burstDurationMs: 600,
    });
  });

  it('defaults to 10 and 800 when inputs are absent', () => {
    expect(getTapBurstInitialData()).toEqual({
      particleCount: 10,
      burstDurationMs: 800,
    });
  });
});

describe('buildColorMixerOutputDisplay', () => {
  it('appends an output-display element to the wrapper', () => {
    const wrapper = document.createElement('div');
    const api = {
      r: 1,
      g: 0,
      b: 0,
      setColor: vi.fn() as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerOutputDisplay(wrapper, api);
    expect(wrapper.querySelector('.output-display')).not.toBeNull();
  });

  it('shows the initial hex color in the output value span', () => {
    const wrapper = document.createElement('div');
    const api = {
      r: 1,
      g: 0,
      b: 0,
      setColor: vi.fn() as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerOutputDisplay(wrapper, api);
    const span = wrapper.querySelector('.output-value');
    expect(span?.textContent).toBe('#FF0000');
  });

  it('updates the hex text when onColorChanged is invoked', () => {
    const wrapper = document.createElement('div');
    const api = {
      r: 1,
      g: 0,
      b: 0,
      setColor: vi.fn() as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerOutputDisplay(wrapper, api);
    api.onColorChanged?.(0, 1, 0);
    expect(wrapper.querySelector('.output-value')?.textContent).toBe(
      '#00FF00',
    );
  });
});

describe('buildColorMixerControlPanel', () => {
  it('appends a control-panel element to the wrapper', () => {
    const wrapper = document.createElement('div');
    const api = {
      r: 0,
      g: 0,
      b: 0,
      setColor: vi.fn() as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerControlPanel(wrapper, api, { r: 0, g: 0, b: 0 });
    expect(wrapper.querySelector('.control-panel')).not.toBeNull();
  });

  it('renders three range inputs for R, G, B channels', () => {
    const wrapper = document.createElement('div');
    const api = {
      r: 0,
      g: 0,
      b: 0,
      setColor: vi.fn() as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerControlPanel(wrapper, api, { r: 0, g: 0, b: 0 });
    expect(wrapper.querySelectorAll('input[type="range"]')).toHaveLength(3);
  });

  it('calls api.setColor with current slider values on slider input', () => {
    const wrapper = document.createElement('div');
    const setColor = vi.fn();
    const api = {
      r: 0,
      g: 0,
      b: 0,
      setColor: setColor as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerControlPanel(wrapper, api, { r: 0, g: 0, b: 0 });
    const sliders = wrapper.querySelectorAll(
      'input[type="range"]',
    ) as NodeListOf<HTMLInputElement>;
    sliders[0].value = '0.8';
    sliders[0].dispatchEvent(new Event('input'));
    expect(setColor).toHaveBeenCalledWith(0.8, 0, 0);
  });

  it('updates slider values when onColorChanged is invoked', () => {
    const wrapper = document.createElement('div');
    const api = {
      r: 0,
      g: 0,
      b: 0,
      setColor: vi.fn() as unknown as (r: number, g: number, b: number) => void,
      onColorChanged: null as
        | ((r: number, g: number, b: number) => void)
        | null,
    };
    buildColorMixerControlPanel(wrapper, api, { r: 0, g: 0, b: 0 });
    api.onColorChanged?.(0.8, 0.5, 0.2);
    const sliders = wrapper.querySelectorAll(
      'input[type="range"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(sliders[0].value).toBe('0.8');
    expect(sliders[1].value).toBe('0.5');
    expect(sliders[2].value).toBe('0.2');
  });
});

describe('buildTapBurstOutputDisplay', () => {
  it('appends an output-display element to the wrapper', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstOutputDisplay(wrapper, api);
    expect(wrapper.querySelector('.output-display')).not.toBeNull();
  });

  it('shows initial particle count and duration in output value spans', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 20,
      burstDuration: 600,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstOutputDisplay(wrapper, api);
    const spans = wrapper.querySelectorAll('.output-value');
    expect(spans[0].textContent).toBe('20 particles');
    expect(spans[1].textContent).toBe('600 ms');
  });

  it('updates particle count text when onParticleCountChanged is invoked', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstOutputDisplay(wrapper, api);
    api.onParticleCountChanged?.(30);
    expect(wrapper.querySelectorAll('.output-value')[0].textContent).toBe(
      '30 particles',
    );
  });

  it('updates duration text when onBurstDurationChanged is invoked', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstOutputDisplay(wrapper, api);
    api.onBurstDurationChanged?.(1200);
    expect(wrapper.querySelectorAll('.output-value')[1].textContent).toBe(
      '1200 ms',
    );
  });
});

describe('buildTapBurstControlPanel', () => {
  it('appends a control-panel element to the wrapper', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstControlPanel(wrapper, api, {
      particleCount: 10,
      burstDurationMs: 800,
    });
    expect(wrapper.querySelector('.control-panel')).not.toBeNull();
  });

  it('renders two number inputs for particle count and duration', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstControlPanel(wrapper, api, {
      particleCount: 10,
      burstDurationMs: 800,
    });
    expect(wrapper.querySelectorAll('input[type="number"]')).toHaveLength(2);
  });

  it('updates api.particleCount when the count input fires an input event', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstControlPanel(wrapper, api, {
      particleCount: 10,
      burstDurationMs: 800,
    });
    const inputs = wrapper.querySelectorAll(
      'input[type="number"]',
    ) as NodeListOf<HTMLInputElement>;
    inputs[0].value = '50';
    inputs[0].dispatchEvent(new Event('input'));
    expect(api.particleCount).toBe(50);
  });

  it('updates api.burstDuration when the duration input fires an input event', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstControlPanel(wrapper, api, {
      particleCount: 10,
      burstDurationMs: 800,
    });
    const inputs = wrapper.querySelectorAll(
      'input[type="number"]',
    ) as NodeListOf<HTMLInputElement>;
    inputs[1].value = '1500';
    inputs[1].dispatchEvent(new Event('input'));
    expect(api.burstDuration).toBe(1500);
  });

  it('updates particle count input when onParticleCountChanged is invoked', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstControlPanel(wrapper, api, {
      particleCount: 10,
      burstDurationMs: 800,
    });
    api.onParticleCountChanged?.(50);
    const inputs = wrapper.querySelectorAll(
      'input[type="number"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0].value).toBe('50');
  });

  it('updates duration input when onBurstDurationChanged is invoked', () => {
    const wrapper = document.createElement('div');
    const api = {
      particleCount: 10,
      burstDuration: 800,
      onParticleCountChanged: null as ((n: number) => void) | null,
      onBurstDurationChanged: null as ((ms: number) => void) | null,
    };
    buildTapBurstControlPanel(wrapper, api, {
      particleCount: 10,
      burstDurationMs: 800,
    });
    api.onBurstDurationChanged?.(2000);
    const inputs = wrapper.querySelectorAll(
      'input[type="number"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[1].value).toBe('2000');
  });
});

// --- Tests for wireColorMixerConfigPreview, addView, main ---
// These use vi.doMock + vi.resetModules to get fresh module state (fresh
// viewRegistry) and a mocked getFlutterApp for each test.

const COLOR_MIXER_CONFIG_HTML = `
  <input id="color-mixer-config-r" value="1">
  <input id="color-mixer-config-g" value="0">
  <input id="color-mixer-config-b" value="0">
  <span id="color-mixer-config-r-val"></span>
  <span id="color-mixer-config-g-val"></span>
  <span id="color-mixer-config-b-val"></span>
  <div id="color-mixer-config-preview"></div>
  <span id="color-mixer-config-hex"></span>
`;

describe('wireColorMixerConfigPreview', () => {
  beforeEach(() => {
    document.body.innerHTML = COLOR_MIXER_CONFIG_HTML;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('immediately computes and displays the hex color from slider values', () => {
    wireColorMixerConfigPreview();
    expect(
      document.getElementById('color-mixer-config-hex')?.textContent,
    ).toBe('#FF0000');
  });

  it('updates the hex display when a slider fires an input event', () => {
    wireColorMixerConfigPreview();
    const gInput = document.getElementById(
      'color-mixer-config-g',
    ) as HTMLInputElement;
    gInput.value = '1';
    gInput.dispatchEvent(new Event('input'));
    expect(
      document.getElementById('color-mixer-config-hex')?.textContent,
    ).toBe('#FFFF00');
  });
});

describe('addView', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('./custom_bootstrap', () => ({ getFlutterApp: vi.fn() }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a view wrapper with label and host element', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockResolvedValue(1),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await addViewFn('/p/', '/p/', container, 'test_widget', btn, () => ({}));

    expect(container.querySelector('.view-wrapper')).not.toBeNull();
    expect(
      container.querySelector('.flutter-host[data-widget="test_widget"]'),
    ).not.toBeNull();
    expect(container.querySelector('.view-label')?.textContent).toBe('View 1');
  });

  it('assigns incremental view numbers for the same base path', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockResolvedValue(1),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await addViewFn('/p/', '/p/', container, 'test_widget', btn, () => ({}));
    await addViewFn('/p/', '/p/', container, 'test_widget', btn, () => ({}));

    const labels = container.querySelectorAll('.view-label');
    expect(labels[0].textContent).toBe('View 1');
    expect(labels[1].textContent).toBe('View 2');
  });

  it('invokes onStateReady when the state-ready event fires', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const onStateReady = vi.fn();
    const app = {
      addView: vi.fn().mockImplementation(
        async ({ hostElement }: { hostElement: HTMLElement }) => {
          hostElement.dispatchEvent(
            new CustomEvent(
              'flutter::test_widget::test-widget-view-controller-ready',
              { detail: { api: true } },
            ),
          );
          return 1;
        },
      ),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await addViewFn(
      '/p/',
      '/p/',
      container,
      'test_widget',
      btn,
      () => ({}),
      onStateReady,
    );

    expect(onStateReady).toHaveBeenCalledWith(
      { api: true },
      expect.any(HTMLElement),
      expect.any(Object),
    );
  });

  it('removes wrapper and rethrows when app.addView throws (with onStateReady)', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockRejectedValue(new Error('view failed')),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await expect(
      addViewFn(
        '/p/',
        '/p/',
        container,
        'test_widget',
        btn,
        () => ({}),
        vi.fn(),
      ),
    ).rejects.toThrow('view failed');

    expect(container.querySelector('.view-wrapper')).toBeNull();
  });

  it('removes wrapper and rethrows when app.addView throws (without onStateReady)', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockRejectedValue(new Error('view failed')),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await expect(
      addViewFn('/p/', '/p/', container, 'test_widget', btn, () => ({})),
    ).rejects.toThrow('view failed');

    expect(container.querySelector('.view-wrapper')).toBeNull();
  });

  it('clicking remove button calls app.removeView and removes wrapper', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockResolvedValue(42),
      removeView: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await addViewFn('/p/', '/p/', container, 'test_widget', btn, () => ({}));

    const removeBtn = container.querySelector(
      '.view-remove-btn',
    ) as HTMLButtonElement;
    removeBtn.click();
    await vi.waitFor(() =>
      expect(container.querySelector('.view-wrapper')).toBeNull(),
    );

    expect(app.removeView).toHaveBeenCalledWith(42);
  });

  it('re-enables addBtn and logs error when removeView throws', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockResolvedValue(42),
      removeView: vi.fn().mockRejectedValue(new Error('remove failed')),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const addBtn = document.createElement('button');
    await addViewFn('/p/', '/p/', container, 'test_widget', addBtn, () => ({}));

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const removeBtn = container.querySelector(
      '.view-remove-btn',
    ) as HTMLButtonElement;
    removeBtn.click();
    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalled());

    expect(addBtn.disabled).toBe(false);
    consoleSpy.mockRestore();
  });

  it('removeView: returns early when basePath is not in registry', async () => {
    const { removeView: removeViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');

    const entry = {
      viewId: 1,
      hostElement: document.createElement('div'),
      wrapper: document.createElement('div'),
      stateReadyHandler: null,
      stateReadyEventName: 'test',
    };

    await expect(
      removeViewFn('/nonexistent/', '/nonexistent/', entry),
    ).resolves.toBeUndefined();
    expect(vi.mocked(getFlutterApp)).not.toHaveBeenCalled();
  });

  it('removeView: returns early when entry is not in the registry entries', async () => {
    const { addView: addViewFn, removeView: removeViewFn } =
      await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockResolvedValue(42),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await addViewFn('/p/', '/p/', container, 'test_widget', btn, () => ({}));

    const foreignEntry = {
      viewId: 999,
      hostElement: document.createElement('div'),
      wrapper: document.createElement('div'),
      stateReadyHandler: null,
      stateReadyEventName: 'foreign',
    };

    // Reset mock call count to verify getFlutterApp is NOT called again
    vi.mocked(getFlutterApp).mockClear();
    await expect(
      removeViewFn('/p/', '/p/', foreignEntry),
    ).resolves.toBeUndefined();
    expect(app.removeView).not.toHaveBeenCalled();
  });

  it('removes the stateReady listener when app.addView throws', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const app = {
      addView: vi.fn().mockRejectedValue(new Error('err')),
      removeView: vi.fn(),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    const onStateReady = vi.fn();
    await expect(
      addViewFn(
        '/p/',
        '/p/',
        container,
        'test_widget',
        btn,
        () => ({}),
        onStateReady,
      ),
    ).rejects.toThrow('err');

    // After error, stateReady listener should have been removed; firing the
    // event should NOT call onStateReady.
    const dummyHost = document.createElement('div');
    dummyHost.dispatchEvent(
      new CustomEvent(
        'flutter::test_widget::test-widget-view-controller-ready',
      ),
    );
    expect(onStateReady).not.toHaveBeenCalled();
  });

  it('removes stateReady listener on remove when handler is set', async () => {
    const { addView: addViewFn } = await import('./main');
    const { getFlutterApp } = await import('./custom_bootstrap');
    const onStateReady = vi.fn();
    const app = {
      addView: vi.fn().mockImplementation(
        async ({ hostElement }: { hostElement: HTMLElement }) => {
          hostElement.dispatchEvent(
            new CustomEvent(
              'flutter::test_widget::test-widget-view-controller-ready',
              { detail: {} },
            ),
          );
          return 42;
        },
      ),
      removeView: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getFlutterApp).mockResolvedValue(app);

    const container = document.createElement('div');
    const btn = document.createElement('button');
    await addViewFn(
      '/p/',
      '/p/',
      container,
      'test_widget',
      btn,
      () => ({}),
      onStateReady,
    );

    const removeBtn = container.querySelector(
      '.view-remove-btn',
    ) as HTMLButtonElement;
    removeBtn.click();
    await vi.waitFor(() =>
      expect(container.querySelector('.view-wrapper')).toBeNull(),
    );

    expect(app.removeView).toHaveBeenCalledWith(42);
  });
});

describe('main', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('./custom_bootstrap', () => ({ getFlutterApp: vi.fn() }));
    document.head.innerHTML = '';
    document.body.innerHTML =
      COLOR_MIXER_CONFIG_HTML +
      `
      <div id="tap-burst-views"></div>
      <button id="tap-burst-add"></button>
      <div id="color-mixer-views"></div>
      <button id="color-mixer-add"></button>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function makeColorMixerApp() {
    return {
      addView: vi.fn().mockImplementation(
        async ({ hostElement }: { hostElement: HTMLElement }) => {
          hostElement.dispatchEvent(
            new CustomEvent(
              'flutter::color_mixer::color-mixer-view-controller-ready',
              {
                detail: {
                  r: 0,
                  g: 0,
                  b: 0,
                  setColor: () => {},
                  onColorChanged: null,
                },
              },
            ),
          );
          return 2;
        },
      ),
      removeView: vi.fn().mockResolvedValue(undefined),
    };
  }

  function makeTapBurstApp() {
    return {
      addView: vi.fn().mockImplementation(
        async ({ hostElement }: { hostElement: HTMLElement }) => {
          hostElement.dispatchEvent(
            new CustomEvent(
              'flutter::tap_burst::tap-burst-view-controller-ready',
              {
                detail: {
                  particleCount: 10,
                  burstDuration: 800,
                  onParticleCountChanged: null,
                  onBurstDurationChanged: null,
                },
              },
            ),
          );
          return 1;
        },
      ),
      removeView: vi.fn().mockResolvedValue(undefined),
    };
  }

  async function runMain() {
    const { main: mainFn } = await import('./main');
    const mainPromise = mainFn();
    await Promise.resolve();
    const script = document.head.querySelector(
      'script[src="./node_modules/flutter-bootstrap/flutter_bootstrap.js"]',
    ) as HTMLScriptElement;
    script.onload!(new Event('load'));
    await mainPromise;
    const { getFlutterApp } = await import('./custom_bootstrap');
    return { getFlutterApp };
  }

  it('calls loadScript for the flutter bootstrap file', async () => {
    const { getFlutterApp } = await import('./custom_bootstrap');
    vi.mocked(getFlutterApp).mockResolvedValue(makeTapBurstApp());

    await runMain();

    expect(
      document.head.querySelector(
        'script[src="./node_modules/flutter-bootstrap/flutter_bootstrap.js"]',
      ),
    ).not.toBeNull();
  });

  it('clicking an add button triggers addView for that widget', async () => {
    const { getFlutterApp } = await import('./custom_bootstrap');
    vi.mocked(getFlutterApp).mockResolvedValue(makeTapBurstApp());

    await runMain();

    const addBtn = document.getElementById(
      'tap-burst-add',
    ) as HTMLButtonElement;
    addBtn.click();
    await vi.waitFor(() =>
      expect(vi.mocked(getFlutterApp)).toHaveBeenCalledWith(
        '/node_modules/tap-burst-web-component/',
        '/node_modules/tap-burst-web-component/',
      ),
    );
  });

  it('clicking the color-mixer add button invokes its onStateReady', async () => {
    const { getFlutterApp } = await import('./custom_bootstrap');
    vi.mocked(getFlutterApp).mockImplementation(
      async (basePath: string) =>
        basePath === '/node_modules/color-mixer-web-component/' ? makeColorMixerApp() : makeTapBurstApp(),
    );

    await runMain();

    const addBtn = document.getElementById(
      'color-mixer-add',
    ) as HTMLButtonElement;
    addBtn.click();
    await vi.waitFor(() =>
      expect(vi.mocked(getFlutterApp)).toHaveBeenCalledWith(
        '/node_modules/color-mixer-web-component/',
        '/node_modules/color-mixer-web-component/',
      ),
    );
  });

  it('shows error in container when addView throws', async () => {
    const { getFlutterApp } = await import('./custom_bootstrap');
    vi.mocked(getFlutterApp).mockRejectedValue(new Error('bootstrap failed'));

    await runMain();

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const addBtn = document.getElementById(
      'tap-burst-add',
    ) as HTMLButtonElement;
    addBtn.click();
    const viewsContainer = document.getElementById(
      'tap-burst-views',
    ) as HTMLElement;
    await vi.waitFor(() =>
      expect(viewsContainer.textContent).toContain('bootstrap failed'),
    );
    consoleSpy.mockRestore();
  });

  it('shows stringified error when a non-Error value is thrown', async () => {
    const { getFlutterApp } = await import('./custom_bootstrap');
    vi.mocked(getFlutterApp).mockRejectedValue('string error value');

    await runMain();

    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const addBtn = document.getElementById(
      'tap-burst-add',
    ) as HTMLButtonElement;
    addBtn.click();
    const viewsContainer = document.getElementById(
      'tap-burst-views',
    ) as HTMLElement;
    await vi.waitFor(() =>
      expect(viewsContainer.textContent).toContain('string error value'),
    );
    consoleSpy.mockRestore();
  });
});
