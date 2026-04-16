import { getFlutterApp } from './custom_bootstrap';

type FlutterApp = Awaited<ReturnType<typeof getFlutterApp>>;
type ViewEntry = { viewId: number; hostElement: HTMLElement; wrapper: HTMLElement; stateReadyHandler: ((e: Event) => void) | null; stateReadyEventName: string };

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
export function getColorMixerInitialData(): { r: number; g: number; b: number } {
  const r = parseFloat((document.getElementById('color-mixer-config-r') as HTMLInputElement)?.value ?? '0');
  const g = parseFloat((document.getElementById('color-mixer-config-g') as HTMLInputElement)?.value ?? '0');
  const b = parseFloat((document.getElementById('color-mixer-config-b') as HTMLInputElement)?.value ?? '0');
  return { r, g, b };
}

/** Reads Tap Burst initial config from the config panel inputs. */
export function getTapBurstInitialData(): { particleCount: number; burstDurationMs: number } {
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
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () =>
      reject(
        new Error(`Failed to load "${src}".\nRun "npm run prestart" or "npm run prebuild" to generate Flutter assets.`),
      );
    document.head.appendChild(el);
  });
}

/** Displays an error message inside the views container. */
export function showError(container: HTMLElement, message: string): void {
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

export const toColorHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
export const rgbToHex = (r: number, g: number, b: number) =>
  `#${toColorHex(r)}${toColorHex(g)}${toColorHex(b)}`.toUpperCase();

function setSliderGradients(sliders: HTMLInputElement[], r: number, g: number, b: number): void {
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);
  sliders[0].style.setProperty('--from-color', `rgb(0,${gi},${bi})`);
  sliders[0].style.setProperty('--to-color', `rgb(255,${gi},${bi})`);
  sliders[1].style.setProperty('--from-color', `rgb(${ri},0,${bi})`);
  sliders[1].style.setProperty('--to-color', `rgb(${ri},255,${bi})`);
  sliders[2].style.setProperty('--from-color', `rgb(${ri},${gi},0)`);
  sliders[2].style.setProperty('--to-color', `rgb(${ri},${gi},255)`);
}


/** Builds and appends a Color Mixer output display to the view wrapper, wired to the given API. */
export function buildColorMixerOutputDisplay(wrapper: HTMLElement, api: ColorMixerApi): void {
  const display = document.createElement('div');
  display.className = 'output-display';

  const hexText = document.createElement('span');
  hexText.className = 'output-value';
  hexText.textContent = rgbToHex(api.r, api.g, api.b);
  display.appendChild(hexText);

  api.onColorChanged = (r, g, b) => {
    hexText.textContent = rgbToHex(r, g, b);
  };

  wrapper.appendChild(display);
}

/** Builds and appends a Color Mixer control panel to the view wrapper, wired to the given API. */
export function buildColorMixerControlPanel(wrapper: HTMLElement, api: ColorMixerApi, init: { r: number; g: number; b: number }): void {
  const panel = document.createElement('div');
  panel.className = 'control-panel';

  const inner = document.createElement('div');
  inner.className = 'color-mixer-inner';

  const swatchCol = document.createElement('div');
  swatchCol.className = 'color-swatch-col';
  const swatch = document.createElement('div');
  swatch.className = 'color-swatch';
  swatchCol.appendChild(swatch);
  inner.appendChild(swatchCol);

  const slidersCol = document.createElement('div');
  slidersCol.className = 'color-mixer-sliders';

  const sliders: HTMLInputElement[] = [];
  const valSpans: HTMLElement[] = [];
  for (const [label, initVal] of [['R', init.r], ['G', init.g], ['B', init.b]] as [string, number][]) {
    const row = document.createElement('label');
    row.className = 'control-row';
    row.dataset.channel = label.toLowerCase();
    const span = document.createElement('span');
    span.textContent = label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = String(initVal);
    const valSpan = document.createElement('span');
    valSpan.className = 'color-value';
    valSpan.textContent = String(toInt255(initVal));
    sliders.push(input);
    valSpans.push(valSpan);
    row.appendChild(span);
    row.appendChild(input);
    row.appendChild(valSpan);
    slidersCol.appendChild(row);
  }
  inner.appendChild(slidersCol);
  panel.appendChild(inner);

  const updateSwatch = (r: number, g: number, b: number) => {
    swatch.style.background = rgbToHex(r, g, b);
    valSpans[0].textContent = String(toInt255(r));
    valSpans[1].textContent = String(toInt255(g));
    valSpans[2].textContent = String(toInt255(b));
    setSliderGradients(sliders, r, g, b);
  };

  updateSwatch(init.r, init.g, init.b);

  const fire = () => {
    const r = parseFloat(sliders[0].value);
    const g = parseFloat(sliders[1].value);
    const b = parseFloat(sliders[2].value);
    api.setColor(r, g, b);
    setSliderGradients(sliders, r, g, b);
  };
  sliders.forEach((s) => s.addEventListener('input', fire));

  const prevOnColorChanged = api.onColorChanged;
  api.onColorChanged = (r, g, b) => {
    prevOnColorChanged?.(r, g, b);
    sliders[0].value = String(r);
    sliders[1].value = String(g);
    sliders[2].value = String(b);
    updateSwatch(r, g, b);
  };

  wrapper.appendChild(panel);
}

/** Builds and appends a Tap Burst output display to the view wrapper, wired to the given API. */
export function buildTapBurstOutputDisplay(wrapper: HTMLElement, api: TapBurstApi): void {
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
export function buildTapBurstControlPanel(wrapper: HTMLElement, api: TapBurstApi, init: { particleCount: number; burstDurationMs: number }): void {
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
export async function addView(
  basePath: string,
  assetBase: string,
  viewsContainer: HTMLElement,
  widgetName: string,
  addBtn: HTMLButtonElement,
  getInitialData: () => unknown,
  onStateReady?: (api: unknown, wrapper: HTMLElement, initialData: unknown) => void,
): Promise<FlutterApp> {
  const app = await getFlutterApp(basePath, assetBase);
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

  const stateReadyEventName = `flutter::${widgetName}::${widgetName.replaceAll('_', '-')}-view-controller-ready`;
  // eslint-disable-next-line prefer-const
  let viewId!: number;
  const stateReadyHandler: ((e: Event) => void) | null = onStateReady
    ? (e: Event) => {
      onStateReady((e as CustomEvent).detail, wrapper, initialData);
    }
    : null;
  if (stateReadyHandler) {
    host.addEventListener(stateReadyEventName, stateReadyHandler, { once: true });
  }

  try {
    viewId = await app.addView({ hostElement: host, initialData });
  } catch (err) {
    if (stateReadyHandler) {
      host.removeEventListener(stateReadyEventName, stateReadyHandler);
    }
    wrapper.remove();
    throw err;
  }

  if (!viewRegistry.has(basePath)) viewRegistry.set(basePath, []);
  const entry: ViewEntry = { viewId, hostElement: host, wrapper, stateReadyHandler, stateReadyEventName };
  viewRegistry.get(basePath)!.push(entry);

  removeBtn.addEventListener('click', async () => {
    removeBtn.disabled = true;
    addBtn.disabled = true;
    try {
      await removeView(basePath, assetBase, entry);
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
export async function removeView(basePath: string, assetBase: string, entry: ViewEntry): Promise<void> {
  const entries = viewRegistry.get(basePath); /* v8 ignore next */
  if (!entries) return;
  const index = entries.indexOf(entry); /* v8 ignore next */
  if (index === -1) return;
  entries.splice(index, 1);
  if (entry.stateReadyHandler) {
    entry.hostElement.removeEventListener(entry.stateReadyEventName, entry.stateReadyHandler);
  }
  const app = await getFlutterApp(basePath, assetBase);
  await app.removeView(entry.viewId);
  entry.wrapper.remove();
}

export const toInt255 = (v: number) => Math.round(v * 255);

export function wireColorMixerConfigPreview(): void {
  const rInput = document.getElementById('color-mixer-config-r') as HTMLInputElement;
  const gInput = document.getElementById('color-mixer-config-g') as HTMLInputElement;
  const bInput = document.getElementById('color-mixer-config-b') as HTMLInputElement;
  const rVal = document.getElementById('color-mixer-config-r-val') as HTMLElement;
  const gVal = document.getElementById('color-mixer-config-g-val') as HTMLElement;
  const bVal = document.getElementById('color-mixer-config-b-val') as HTMLElement;
  const swatch = document.getElementById('color-mixer-config-preview') as HTMLElement;
  const hexLabel = document.getElementById('color-mixer-config-hex') as HTMLElement;
  const configSliders = [rInput, gInput, bInput];
  const update = () => {
    const r = parseFloat(rInput.value);
    const g = parseFloat(gInput.value);
    const b = parseFloat(bInput.value);
    const hex = rgbToHex(r, g, b);
    swatch.style.background = hex;
    hexLabel.textContent = hex;
    rVal.textContent = String(toInt255(r));
    gVal.textContent = String(toInt255(g));
    bVal.textContent = String(toInt255(b));
    setSliderGradients(configSliders, r, g, b);
  };
  rInput.addEventListener('input', update);
  gInput.addEventListener('input', update);
  bInput.addEventListener('input', update);
  update();
}

export async function main(): Promise<void> {
  wireColorMixerConfigPreview();
  await loadScript('./node_modules/flutter-bootstrap/flutter_bootstrap.js');

  const widgets = [
    {
      basePath: '/node_modules/tap-burst-web-component/',
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
      basePath: '/node_modules/color-mixer-web-component/',
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
          await addView(basePath, basePath, viewsContainer, widgetName, addBtn, getInitialData, onStateReadyAndReenableBtn);
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

/* v8 ignore start */
if (!import.meta.env.VITEST) {
  main().catch((err: unknown) => {
    console.error('[widgets-preview]', err);
  });
}
/* v8 ignore end */
