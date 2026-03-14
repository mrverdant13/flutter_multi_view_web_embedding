import { getFlutterApp } from './custom_bootstrap';

type FlutterApp = Awaited<ReturnType<typeof getFlutterApp>>;
type ViewEntry = { viewId: number; hostElement: HTMLElement; wrapper: HTMLElement };

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

/**
 * Creates a new Flutter view and appends it to the views container.
 * Each wrapper includes a per-view remove button.
 */
async function addView(
  basePath: string,
  viewsContainer: HTMLElement,
  widgetName: string,
  addBtn: HTMLButtonElement,
): Promise<FlutterApp> {
  const app = await getFlutterApp(basePath, basePath);
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

  const viewId = await app.addView({ hostElement: host });

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
    },
    {
      basePath: '/color-mixer/',
      widgetName: 'color_mixer',
      viewsId: 'color-mixer-views',
      addId: 'color-mixer-add',
    },
  ];

  await Promise.all(
    widgets.map(async ({ basePath, widgetName, viewsId, addId }) => {
      const viewsContainer = document.getElementById(viewsId) as HTMLElement;
      const addBtn = document.getElementById(addId) as HTMLButtonElement;

      addBtn.addEventListener('click', async () => {
        addBtn.disabled = true;
        try {
          await addView(basePath, viewsContainer, widgetName, addBtn);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[widgets-preview] addView ${basePath}:`, msg);
          showError(viewsContainer, msg);
        } finally {
          addBtn.disabled = false;
        }
      });

    }),
  );
}

main().catch((err: unknown) => {
  console.error('[widgets-preview]', err);
});
