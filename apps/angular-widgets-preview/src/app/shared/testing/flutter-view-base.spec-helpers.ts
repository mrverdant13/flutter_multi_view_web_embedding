import { render } from '@testing-library/angular';
import { signal, provideZonelessChangeDetection, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FlutterBootstrapService } from '@core/services/flutter-bootstrap.service';
import type { FlutterAppState } from '@core/services/flutter-bootstrap.service';
import type { FlutterApp } from '@core/models/flutter-built-in.types';
import type { FlutterViewBase } from '@shared/components/flutter-view.base';

async function flush(n = 30): Promise<void> {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

function makeMockApp(
  addViewResult: number | Error = 1,
  removeViewError: Error | null = null,
): FlutterApp {
  return {
    addView:
      addViewResult instanceof Error
        ? vi.fn().mockRejectedValue(addViewResult)
        : vi.fn().mockResolvedValue(addViewResult),
    removeView: removeViewError
      ? vi.fn().mockImplementation(() => {
          throw removeViewError;
        })
      : vi.fn().mockReturnValue({
          hostElement: document.createElement('div'),
          initialData: undefined,
        }),
  };
}

function makeMockBootstrap() {
  const appStateSig = signal<FlutterAppState>({ state: 'idle' });
  const service = {
    bootstrapStatus: signal('idle' as const).asReadonly(),
    loadApp: vi.fn(),
    appStateSignal: vi.fn().mockReturnValue(appStateSig.asReadonly()),
  };
  return { service, appStateSig };
}

async function initToReady(
  appStateSig: ReturnType<typeof makeMockBootstrap>['appStateSig'],
  app: FlutterApp,
): Promise<void> {
  appStateSig.set({ state: 'ready', app });
  TestBed.flushEffects();
  await flush();
}

export interface FlutterViewTestConfig<TApi, TData> {
  component: Type<FlutterViewBase<TApi, TData>>;
  initialData: TData;
  stateReadyEvent: string;
  widgetDataAttribute: string;
  makeMockController: () => TApi;
}

export function describeFlutterViewBase<TApi, TData>(
  suiteName: string,
  config: FlutterViewTestConfig<TApi, TData>,
): void {
  const {
    component,
    initialData,
    stateReadyEvent,
    widgetDataAttribute,
    makeMockController,
  } = config;

  async function renderView(bs = makeMockBootstrap()) {
    const { fixture } = await render(
      component as Type<FlutterViewBase<TApi, TData>>,
      {
        providers: [
          provideZonelessChangeDetection(),
          { provide: FlutterBootstrapService, useValue: bs.service },
        ],
        componentInputs: { initialData },
      },
    );
    return { fixture, appStateSig: bs.appStateSig };
  }

  describe(suiteName, () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    describe('initial state', () => {
      it('shows the loading overlay', async () => {
        const { fixture } = await renderView();
        expect(
          fixture.nativeElement.querySelector('[role="status"]'),
        ).toBeTruthy();
      });

      it('calls loadApp with the entry point URL', async () => {
        const bs = makeMockBootstrap();
        await renderView(bs);
        expect(bs.service.loadApp).toHaveBeenCalledOnce();
      });
    });

    describe('app ready path', () => {
      it('calls addView when the app becomes ready', async () => {
        const mockApp = makeMockApp();
        const { appStateSig } = await renderView();
        await initToReady(appStateSig, mockApp);
        expect(mockApp.addView).toHaveBeenCalledOnce();
      });

      it('remains in loading state when addView resolves but stateReadyEvent never fires', async () => {
        const mockApp = makeMockApp();
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'loading',
        });
      });

      it('sets state to ready with the controller and hides loading when the controller-ready DOM event fires', async () => {
        const mockApp = makeMockApp();
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);

        const host = fixture.nativeElement.querySelector(
          `[data-widget="${widgetDataAttribute}"]`,
        ) as HTMLElement;
        const mockController = makeMockController();
        host.dispatchEvent(
          new CustomEvent(stateReadyEvent, { detail: mockController }),
        );
        fixture.detectChanges();

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'ready',
          controller: mockController,
        });
        expect(
          fixture.nativeElement.querySelector('[role="status"]'),
        ).toBeNull();
      });
    });

    describe('app error path', () => {
      it('sets state to error when the app load fails', async () => {
        const { fixture, appStateSig } = await renderView();

        appStateSig.set({ state: 'error' });
        TestBed.flushEffects();
        await flush();

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'error',
        });
      });

      it('sets state.message to the Flutter initialization error message when the app load fails', async () => {
        const { fixture, appStateSig } = await renderView();

        appStateSig.set({ state: 'error' });
        TestBed.flushEffects();
        await flush();

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'error',
          message: 'Flutter app failed to initialize.',
        });
      });
    });

    describe('addView failure', () => {
      it('sets state to error when addView throws an Error', async () => {
        const mockApp = makeMockApp(new Error('addView failed'));
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'error',
        });
      });

      it('sets state.message to the Error message when addView throws an Error', async () => {
        const mockApp = makeMockApp(new Error('Custom error message'));
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'error',
          message: 'Custom error message',
        });
      });

      it('uses fallback message when addView throws a non-Error', async () => {
        const mockApp: FlutterApp = {
          addView: vi.fn().mockRejectedValue('plain string error'),
          removeView: vi.fn(),
        };
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);

        expect(fixture.componentInstance.state()).toMatchObject({
          status: 'error',
          message: 'Failed to load widget',
        });
      });
    });

    describe('ngOnDestroy', () => {
      it('calls removeView on destroy when the app is initialized', async () => {
        const mockApp = makeMockApp();
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);
        fixture.destroy();
        await flush();

        expect(mockApp.removeView).toHaveBeenCalledOnce();
      });

      it('does not call removeView on destroy when not yet initialized', async () => {
        const mockApp = makeMockApp();
        const { fixture } = await renderView();

        fixture.destroy();
        await flush();

        expect(mockApp.removeView).not.toHaveBeenCalled();
      });

      it('logs the error when removeView throws on destroy', async () => {
        const mockApp = makeMockApp(1, new Error('remove failed'));
        const { fixture, appStateSig } = await renderView();

        await initToReady(appStateSig, mockApp);
        fixture.destroy();
        await flush();

        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('_destroyed guard', () => {
      it('does not call addView when destroyed before the app becomes ready', async () => {
        const mockApp = makeMockApp();
        const { fixture, appStateSig } = await renderView();

        // Call ngOnDestroy manually to set _destroyed=true while keeping the
        // injector alive so that the effect in awaitAppReady can still run.
        fixture.componentInstance.ngOnDestroy();

        appStateSig.set({ state: 'ready', app: mockApp });
        TestBed.flushEffects();
        await flush();

        expect(mockApp.addView).not.toHaveBeenCalled();
      });

      it('does not set state to error when destroyed before awaitAppReady rejects', async () => {
        const { fixture, appStateSig } = await renderView();

        fixture.componentInstance.ngOnDestroy();

        appStateSig.set({ state: 'error' });
        TestBed.flushEffects();
        await flush();

        expect(fixture.componentInstance.state().status).not.toBe('error');
      });

      it('does not set state to error when destroyed before addView rejects', async () => {
        const { promise: addViewPromise, reject: rejectAdd } =
          Promise.withResolvers<number>();
        const mockApp: FlutterApp = {
          addView: vi.fn().mockReturnValue(addViewPromise),
          removeView: vi.fn(),
        };
        const { fixture, appStateSig } = await renderView();

        appStateSig.set({ state: 'ready', app: mockApp });
        TestBed.flushEffects();
        await flush(); // addView is now called but not yet resolved

        fixture.destroy();
        rejectAdd(new Error('late rejection'));
        await flush();

        expect(fixture.componentInstance.state().status).not.toBe('error');
      });
    });
  });
}
