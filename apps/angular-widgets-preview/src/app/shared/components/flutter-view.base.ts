import {
  AfterViewInit,
  Directive,
  ElementRef,
  Injector,
  OnDestroy,
  Signal,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FlutterApp } from '@core/models/flutter-built-in.types';
import { FlutterBootstrapService } from '@core/services/flutter-bootstrap.service';

export type FlutterViewState<TApi> =
  | { status: 'loading' }
  | { status: 'ready'; controller: TApi }
  | { status: 'error'; message: string };

const LOG_TAG = 'flutter-view';

@Directive()
export abstract class FlutterViewBase<TApi, TData = unknown>
  implements AfterViewInit, OnDestroy
{
  protected readonly bootstrap = inject(FlutterBootstrapService);
  private readonly injector = inject(Injector);

  protected abstract readonly entryPointBaseUrl: string;
  protected abstract readonly assetBaseUrl: string;
  protected abstract readonly stateReadyEvent: string;

  readonly initialData = input<TData>();

  readonly state = signal<FlutterViewState<TApi>>({ status: 'loading' });
  private flutterApp: FlutterApp | undefined;
  private viewId: number | undefined;
  private _destroyed = false;

  protected abstract readonly hostRef: Signal<ElementRef<HTMLElement>>;

  private stateReadyHandler = (e: Event): void => {
    const controller = (e as CustomEvent<TApi>).detail;
    performance.mark(`${LOG_TAG}::controller_ready`, {
      detail: {
        entryPointBaseUrl: this.entryPointBaseUrl,
        viewId: this.viewId,
      },
    });
    this.state.set({ status: 'ready', controller });
  };

  async ngAfterViewInit(): Promise<void> {
    const host = this.hostRef().nativeElement;

    host.addEventListener(this.stateReadyEvent, this.stateReadyHandler);

    this.bootstrap.loadApp(this.entryPointBaseUrl, this.assetBaseUrl);

    try {
      const app = await this.awaitAppReady();
      if (this._destroyed) return;
      this.flutterApp = app;
      this.viewId = await app.addView({
        hostElement: host,
        initialData: this.initialData(),
      });
    } catch (err) {
      if (this._destroyed) return;
      host.removeEventListener(this.stateReadyEvent, this.stateReadyHandler);
      this.state.set({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to load widget',
      });
      console.error(`[${LOG_TAG}] addView failed:`, err);
    }
  }

  private awaitAppReady(): Promise<FlutterApp> {
    const sig = this.bootstrap.appStateSignal(
      this.entryPointBaseUrl,
      this.assetBaseUrl,
    );
    return new Promise<FlutterApp>((resolve, reject) => {
      const ref = effect(
        () => {
          const s = sig();
          if (s.state === 'ready') {
            ref.destroy();
            resolve(s.app);
          } else if (s.state === 'error') {
            ref.destroy();
            reject(new Error('Flutter app failed to initialize.'));
          }
        },
        { injector: this.injector },
      );
    });
  }

  ngOnDestroy(): void {
    this._destroyed = true;
    this.hostRef().nativeElement.removeEventListener(
      this.stateReadyEvent,
      this.stateReadyHandler,
    );
    if (this.flutterApp && this.viewId !== undefined) {
      try {
        const viewData = this.flutterApp.removeView(this.viewId);
        performance.mark(`${LOG_TAG}::view_removed`, {
          detail: {
            entryPointBaseUrl: this.entryPointBaseUrl,
            viewId: this.viewId,
            initialData: viewData.initialData,
            hostElement: {
              tagName: viewData.hostElement.tagName,
              classes: Array.from(viewData.hostElement.classList),
              flutterAttributes: Object.fromEntries(
                Array.from(viewData.hostElement.attributes)
                  .filter((attr) => attr.name.startsWith('flt'))
                  .map((attr) => [attr.name, attr.value]),
              ),
            },
          },
        });
      } catch (err) {
        console.error(`[${LOG_TAG}] removeView failed:`, err);
      }
    }
  }
}
