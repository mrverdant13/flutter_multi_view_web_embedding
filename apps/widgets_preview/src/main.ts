import { getFlutterApp } from './custom_bootstrap';

type FlutterApp = Awaited<ReturnType<typeof getFlutterApp>>;
type ViewEntry = { viewId: number; hostElement: HTMLElement; wrapper: HTMLElement };

interface ColorMixerApi {
  /** Red channel of the current color (0.0–1.0). */
  readonly r: number;
  /** Green channel of the current color (0.0–1.0). */
  readonly g: number;
  /** Blue channel of the current color (0.0–1.0). */
  readonly b: number;
  /** Set color values (0.0–1.0). */
  setColor(r: number, g: number, b: number): void;
  /** Callback invoked on every color change (assign to register). */
  onColorChanged: ((r: number, g: number, b: number) => void) | null;
}

interface TapBurstApi {
  /** Change particle count per burst (1–200). */
  particleCount: number;
  /** Change burst animation duration in ms (100–5000). */
  burstDuration: number;
  /** Callback invoked when particle count changes (assign to register). */
  onParticleCountChanged: ((n: number) => void) | null;
  /** Callback invoked when burst duration changes (assign to register). */
  onBurstDurationChanged: ((ms: number) => void) | null;
}


/** Reads Color Mixer initial config from the config panel inputs. */
function getColorMixerInitialData(): { r: number; g: number; b: number } {
  const r = parseFloat((document.getElementById('color-mixer-config-r') as HTMLInputElement)?.value ?? '0');
  const g = parseFloat((document.getElementById('color-mixer-config-g') as HTMLInputElement)?.value ?? '0');
  const b = parseFloat((document.getElementById('color-mixer-config-b') as HTMLInputElement)?.value ?? '0');
  return { r, g, b };
}

/** Reads Tap Burst initial config from the config panel inputs. */
function getTapBurstInitialData(): { particleCount: number; burstDurationMs: number } {
  const particleCount = parseInt((document.getElementById('tap-burst-config-particle-count') as HTMLInputElement)?.value ?? '10', 10);
  const burstDurationMs = parseInt((document.getElementById('tap-burst-config-burst-duration') as HTMLInputElement)?.value ?? '800', 10);
  return { particleCount, burstDurationMs };
}

/** Tracks active view entries per app, keyed on basePath. */
const viewRegistry = new Map<string, ViewEntry[]>();

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

/** Displays an error message inside the views container. */
function showError(container: HTMLElement, message: string): void {
  Object.assign(container.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    minHeight: '120px',
    color: '#6b6b88',
    fontSize: '0.85rem',
    textAlign: 'center',
  });
  container.textContent = message;
}

/** Builds and appends a Color Mixer output display to the view wrapper, wired to the given API. */
function buildColorMixerOutputDisplay(wrapper: HTMLElement, api: ColorMixerApi): void {
  const display = document.createElement('div');
  display.className = 'output-display';

  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  console.log(api)

  const colorText = document.createElement('span');
  colorText.className = 'output-value';
  const initialHex = `#${toHex(api.r)}${toHex(api.g)}${toHex(api.b)}`;
  colorText.textContent = initialHex;
  colorText.style.color = initialHex;
  display.appendChild(colorText);

  api.onColorChanged = (r, g, b) => {
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    colorText.textContent = hex;
    colorText.style.color = hex;
  };

  wrapper.appendChild(display);
}

/** Builds and appends a Color Mixer control panel to the view wrapper, wired to the given API. */
function buildColorMixerControlPanel(wrapper: HTMLElement, api: ColorMixerApi, init: { r: number; g: number; b: number }): void {
  const panel = document.createElement('div');
  panel.className = 'control-panel';

  const sliders: HTMLInputElement[] = [];
  for (const [label, initVal] of [['R', init.r], ['G', init.g], ['B', init.b]] as [string, number][]) {
    const row = document.createElement('label');
    row.className = 'control-row';
    const span = document.createElement('span');
    span.textContent = label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = String(initVal);
    sliders.push(input);
    row.appendChild(span);
    row.appendChild(input);
    panel.appendChild(row);
  }

  const fire = () => api.setColor(
    parseFloat(sliders[0].value),
    parseFloat(sliders[1].value),
    parseFloat(sliders[2].value),
  );
  sliders.forEach((s) => s.addEventListener('input', fire));

  const prevOnColorChanged = api.onColorChanged;
  api.onColorChanged = (r, g, b) => {
    prevOnColorChanged?.(r, g, b);
    sliders[0].value = String(r);
    sliders[1].value = String(g);
    sliders[2].value = String(b);
  };

  wrapper.appendChild(panel);
}

/** Builds and appends a Tap Burst output display to the view wrapper, wired to the given API. */
function buildTapBurstOutputDisplay(wrapper: HTMLElement, api: TapBurstApi): void {
  const display = document.createElement('div');
  display.className = 'output-display';

  const countText = document.createElement('span');
  countText.className = 'output-value';
  countText.textContent = `${api.particleCount} particles`;

  const durText = document.createElement('span');
  durText.className = 'output-value';
  durText.textContent = `${api.burstDuration} ms`;

  display.appendChild(countText);
  display.appendChild(durText);

  api.onParticleCountChanged = (n) => {
    countText.textContent = `${n} particles`;
  };
  api.onBurstDurationChanged = (ms) => {
    durText.textContent = `${ms} ms`;
  };

  wrapper.appendChild(display);
}

/** Builds and appends a Tap Burst control panel to the view wrapper, wired to the given API. */
function buildTapBurstControlPanel(wrapper: HTMLElement, api: TapBurstApi, init: { particleCount: number; burstDurationMs: number }): void {
  const panel = document.createElement('div');
  panel.className = 'control-panel';

  const countRow = document.createElement('label');
  countRow.className = 'control-row';
  const countLabel = document.createElement('span');
  countLabel.textContent = 'Particles';
  const countInput = document.createElement('input');
  countInput.type = 'number';
  countInput.min = '1';
  countInput.max = '200';
  countInput.value = String(init.particleCount);
  countInput.addEventListener('input', () => { api.particleCount = parseInt(countInput.value, 10); });
  countRow.appendChild(countLabel);
  countRow.appendChild(countInput);
  panel.appendChild(countRow);

  const durRow = document.createElement('label');
  durRow.className = 'control-row';
  const durLabel = document.createElement('span');
  durLabel.textContent = 'Duration (ms)';
  const durInput = document.createElement('input');
  durInput.type = 'number';
  durInput.min = '100';
  durInput.max = '5000';
  durInput.value = String(init.burstDurationMs);
  durInput.addEventListener('input', () => { api.burstDuration = parseInt(durInput.value, 10); });
  durRow.appendChild(durLabel);
  durRow.appendChild(durInput);
  panel.appendChild(durRow);

  const prevOnParticleCountChanged = api.onParticleCountChanged;
  api.onParticleCountChanged = (n) => {
    prevOnParticleCountChanged?.(n);
    countInput.value = String(n);
  };

  const prevOnBurstDurationChanged = api.onBurstDurationChanged;
  api.onBurstDurationChanged = (ms) => {
    prevOnBurstDurationChanged?.(ms);
    durInput.value = String(ms);
  };

  wrapper.appendChild(panel);
}

/**
 * Creates a new Flutter view and appends it to the views container.
 * Each wrapper includes a per-view remove button.
 */
async function addView(
  basePath: string,
  viewsContainer: HTMLElement,
  widgetName: string,
  addBtn: HTMLButtonElement,
  getInitialData: () => unknown,
  onStateReady?: (api: unknown, wrapper: HTMLElement, initialData: unknown) => void,
): Promise<FlutterApp> {
  const app = await getFlutterApp(basePath, basePath);
  const initialData = getInitialData();
  const viewNumber = (viewRegistry.get(basePath)?.length ?? 0) + 1;

  const wrapper = document.createElement('div');
  wrapper.className = 'view-wrapper';

  const label = document.createElement('span');
  label.className = 'view-label';
  label.textContent = `View ${viewNumber}`;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'view-remove-btn';
  removeBtn.textContent = '×';

  const host = document.createElement('div');
  host.className = 'flutter-host';
  host.dataset.widget = widgetName;

  wrapper.appendChild(label);
  wrapper.appendChild(removeBtn);
  wrapper.appendChild(host);
  viewsContainer.appendChild(wrapper);

  if (onStateReady) {
    host.addEventListener(
      'flutter::state_ready',
      (e) => onStateReady((e as CustomEvent).detail, wrapper, initialData),
      { once: true },
    );
  }

  const viewId = await app.addView({ hostElement: host, initialData });

  if (!viewRegistry.has(basePath)) viewRegistry.set(basePath, []);
  const entry: ViewEntry = { viewId, hostElement: host, wrapper };
  viewRegistry.get(basePath)!.push(entry);

  removeBtn.addEventListener('click', async () => {
    removeBtn.disabled = true;
    addBtn.disabled = true;
    try {
      await removeView(basePath, entry);
    } catch (err) {
      console.error(`[widgets-preview] removeView ${basePath}:`, err);
      removeBtn.disabled = false;
    } finally {
      addBtn.disabled = false;
    }
  });

  return app;
}

/**
 * Removes a specific view entry for the given app.
 */
async function removeView(basePath: string, entry: ViewEntry): Promise<void> {
  const entries = viewRegistry.get(basePath);
  if (!entries) return;
  const index = entries.indexOf(entry);
  if (index === -1) return;
  entries.splice(index, 1);
  const app = await getFlutterApp(basePath, basePath);
  await app.removeView(entry.viewId);
  entry.wrapper.remove();
}

async function main(): Promise<void> {
  await loadScript('/flutter-bootstrap/flutter_bootstrap.js');

  const widgets = [
    {
      basePath: '/tap-burst/',
      widgetName: 'tap_burst',
      viewsId: 'tap-burst-views',
      addId: 'tap-burst-add',
      getInitialData: getTapBurstInitialData,
      onStateReady: (api: unknown, wrapper: HTMLElement, initialData: unknown) => {
        const typedApi = api as TapBurstApi;
        const initData = initialData as { particleCount: number; burstDurationMs: number };
        buildTapBurstOutputDisplay(wrapper, typedApi);
        buildTapBurstControlPanel(wrapper, typedApi, initData);
      },
    },
    {
      basePath: '/color-mixer/',
      widgetName: 'color_mixer',
      viewsId: 'color-mixer-views',
      addId: 'color-mixer-add',
      getInitialData: getColorMixerInitialData,
      onStateReady: (api: unknown, wrapper: HTMLElement, initialData: unknown) => {
        const typedApi = api as ColorMixerApi;
        const initData = initialData as { r: number; g: number; b: number };
        buildColorMixerOutputDisplay(wrapper, typedApi);
        buildColorMixerControlPanel(wrapper, typedApi, initData);
      },
    },
  ];

  await Promise.all(
    widgets.map(async ({ basePath, widgetName, viewsId, addId, getInitialData, onStateReady }) => {
      const viewsContainer = document.getElementById(viewsId) as HTMLElement;
      const addBtn = document.getElementById(addId) as HTMLButtonElement;

      addBtn.addEventListener('click', async () => {
        addBtn.disabled = true;
        try {
          const onStateReadyAndReenableBtn = (api: unknown, wrapper: HTMLElement, data: unknown) => {
            addBtn.disabled = false;
            onStateReady(api, wrapper, data);
          };
          await addView(basePath, viewsContainer, widgetName, addBtn, getInitialData, onStateReadyAndReenableBtn);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[widgets-preview] addView ${basePath}:`, msg);
          showError(viewsContainer, msg);
          addBtn.disabled = false;
        }
      });

    }),
  );
}

main().catch((err: unknown) => {
  console.error('[widgets-preview]', err);
});
