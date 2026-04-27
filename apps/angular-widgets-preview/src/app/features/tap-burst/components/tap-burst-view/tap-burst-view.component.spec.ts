import { render } from '@testing-library/angular';
import {
  Component,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { TapBurstViewComponent } from './tap-burst-view.component';
import { FlutterViewState } from '@shared/components/flutter-view.base';
import type {
  TapBurstApi,
  TapBurstInitialData,
} from '../../models/tap-burst.types';

@Component({
  selector: 'app-tap-burst-flutter-view',
  standalone: true,
  template: '',
})
class TapBurstFlutterViewStub {
  readonly initialData = input<TapBurstInitialData>();
  readonly state = signal<FlutterViewState<TapBurstApi>>({ status: 'loading' });
}

@Component({
  selector: 'app-tap-burst-control-panel',
  standalone: true,
  template: '',
})
class TapBurstControlPanelStub {
  readonly type = input<string>();
  readonly particleCount = input<number>();
  readonly burstDuration = input<number>();
}

const INITIAL_DATA: TapBurstInitialData = {
  particleCount: 5,
  burstDurationMs: 500,
};

const MOCK_API: TapBurstApi = {
  particleCount: 5,
  burstDuration: 500,
  onParticleCountChanged: null,
  onBurstDurationChanged: null,
};

async function renderView() {
  TestBed.overrideComponent(TapBurstViewComponent, {
    set: { imports: [TapBurstFlutterViewStub, TapBurstControlPanelStub] },
  });
  const { fixture } = await render(TapBurstViewComponent, {
    providers: [provideZonelessChangeDetection()],
    componentInputs: { initialData: INITIAL_DATA },
  });
  const stub = fixture.debugElement.query(By.directive(TapBurstFlutterViewStub))
    .componentInstance as TapBurstFlutterViewStub;
  return { fixture, stub };
}

describe('TapBurstViewComponent', () => {
  describe('flutter view', () => {
    it('renders the flutter view stub', async () => {
      await renderView();
      expect(document.querySelector('app-tap-burst-flutter-view')).toBeTruthy();
    });
  });

  describe('control panel', () => {
    it('does not render the control panel initially', async () => {
      await renderView();
      expect(document.querySelector('app-tap-burst-control-panel')).toBeNull();
    });

    it('renders the control panel after the flutter state becomes ready', async () => {
      const { fixture, stub } = await renderView();
      stub.state.set({ status: 'ready', controller: { ...MOCK_API } });
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(
        document.querySelector('app-tap-burst-control-panel'),
      ).toBeTruthy();
    });

    it('passes store values to the control panel after initialization', async () => {
      const { fixture, stub } = await renderView();
      stub.state.set({ status: 'ready', controller: { ...MOCK_API } });
      TestBed.flushEffects();
      fixture.detectChanges();
      const panel = fixture.debugElement.query(
        By.directive(TapBurstControlPanelStub),
      ).componentInstance as TapBurstControlPanelStub;
      expect(panel.particleCount()).toBe(MOCK_API.particleCount);
      expect(panel.burstDuration()).toBe(MOCK_API.burstDuration);
    });
  });

  describe('store initialization', () => {
    it('initializes the store from the controller when flutter state becomes ready', async () => {
      const { fixture, stub } = await renderView();
      const initSpy = vi.spyOn(
        fixture.componentInstance['store'],
        'initFromController',
      );
      stub.state.set({ status: 'ready', controller: { ...MOCK_API } });
      TestBed.flushEffects();
      expect(initSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: MOCK_API.particleCount,
          burstDuration: MOCK_API.burstDuration,
        }),
      );
    });
  });
});
