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
import { ColorMixerViewComponent } from './color-mixer-view.component';
import { FlutterViewState } from '@shared/components/flutter-view.base';
import type {
  ColorMixerApi,
  ColorMixerInitialData,
} from '../../models/color-mixer.types';

@Component({
  selector: 'app-color-mixer-flutter-view',
  standalone: true,
  template: '',
})
class ColorMixerFlutterViewStub {
  readonly initialData = input<ColorMixerInitialData>();
  readonly state = signal<FlutterViewState<ColorMixerApi>>({
    status: 'loading',
  });
}

@Component({
  selector: 'app-color-mixer-control-panel',
  standalone: true,
  template: '',
})
class ColorMixerControlPanelStub {
  readonly type = input<string>();
  readonly r = input<number>();
  readonly g = input<number>();
  readonly b = input<number>();
}

const INITIAL_DATA: ColorMixerInitialData = { r: 0.5, g: 0.5, b: 0.5 };

const MOCK_API: ColorMixerApi = {
  r: 0.5,
  g: 0.5,
  b: 0.5,
  setColor: vi.fn(),
  onColorChanged: null,
};

async function renderView() {
  TestBed.overrideComponent(ColorMixerViewComponent, {
    set: { imports: [ColorMixerFlutterViewStub, ColorMixerControlPanelStub] },
  });
  const { fixture } = await render(ColorMixerViewComponent, {
    providers: [provideZonelessChangeDetection()],
    componentInputs: { initialData: INITIAL_DATA },
  });
  const stub = fixture.debugElement.query(
    By.directive(ColorMixerFlutterViewStub),
  ).componentInstance as ColorMixerFlutterViewStub;
  return { fixture, stub };
}

describe('ColorMixerViewComponent', () => {
  describe('flutter view', () => {
    it('renders the flutter view stub', async () => {
      await renderView();
      expect(
        document.querySelector('app-color-mixer-flutter-view'),
      ).toBeTruthy();
    });
  });

  describe('control panel', () => {
    it('does not render the control panel initially', async () => {
      await renderView();
      expect(
        document.querySelector('app-color-mixer-control-panel'),
      ).toBeNull();
    });

    it('renders the control panel after the flutter state becomes ready', async () => {
      const { fixture, stub } = await renderView();
      stub.state.set({ status: 'ready', controller: { ...MOCK_API } });
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(
        document.querySelector('app-color-mixer-control-panel'),
      ).toBeTruthy();
    });

    it('passes store values to the control panel after initialization', async () => {
      const { fixture, stub } = await renderView();
      stub.state.set({ status: 'ready', controller: { ...MOCK_API } });
      TestBed.flushEffects();
      fixture.detectChanges();
      const panel = fixture.debugElement.query(
        By.directive(ColorMixerControlPanelStub),
      ).componentInstance as ColorMixerControlPanelStub;
      expect(panel.r()).toBe(MOCK_API.r);
      expect(panel.g()).toBe(MOCK_API.g);
      expect(panel.b()).toBe(MOCK_API.b);
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
          r: MOCK_API.r,
          g: MOCK_API.g,
          b: MOCK_API.b,
        }),
      );
    });
  });
});
