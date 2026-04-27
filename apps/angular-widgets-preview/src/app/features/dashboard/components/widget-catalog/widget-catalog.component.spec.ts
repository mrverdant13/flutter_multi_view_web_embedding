import { render, screen, fireEvent } from '@testing-library/angular';
import {
  Component,
  input,
  output,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { WidgetCatalogComponent } from './widget-catalog.component';
import { DashboardStore } from '../../stores/dashboard.store';
import type { DashboardCard } from '../../stores/dashboard.store';

@Component({
  selector: 'app-tap-burst-control-panel',
  standalone: true,
  template: '',
})
class TapBurstControlPanelStub {
  readonly type = input<string>();
  readonly particleCount = input<number>();
  readonly burstDuration = input<number>();
  readonly particleCountChange = output<number>();
  readonly burstDurationChange = output<number>();
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
  readonly rChange = output<number>();
  readonly gChange = output<number>();
  readonly bChange = output<number>();
}

function makeTapBurstCard(id: string): DashboardCard {
  return {
    type: 'tap-burst',
    id,
    initialData: { particleCount: 10, burstDurationMs: 800 },
  };
}

function makeColorMixerCard(id: string): DashboardCard {
  return { type: 'color-mixer', id, initialData: { r: 0.5, g: 0.5, b: 0.5 } };
}

function makeMockStore(cards: DashboardCard[] = []) {
  return {
    cards: signal(cards).asReadonly(),
    tbParticleCount: signal(10).asReadonly(),
    tbBurstDuration: signal(800).asReadonly(),
    cmR: signal(0.5).asReadonly(),
    cmG: signal(0.5).asReadonly(),
    cmB: signal(0.5).asReadonly(),
    bootstrapStatus: signal('idle').asReadonly(),
    tapBurstEpState: signal('idle').asReadonly(),
    colorMixerEpState: signal('idle').asReadonly(),
    addTapBurst: vi.fn(),
    addColorMixer: vi.fn(),
    setTbParticleCount: vi.fn(),
    setTbBurstDuration: vi.fn(),
    setCmChannel: vi.fn(),
  };
}

async function renderCatalog(cards: DashboardCard[] = []) {
  const mockStore = makeMockStore(cards);
  await render(WidgetCatalogComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: DashboardStore, useValue: mockStore },
    ],
    imports: [TapBurstControlPanelStub, ColorMixerControlPanelStub],
  });
  return { mockStore };
}

describe('WidgetCatalogComponent', () => {
  describe('bootstrap status', () => {
    it('displays the bootstrap status label', async () => {
      await renderCatalog();
      expect(screen.getByText(/flutter_bootstrap\.js · idle/)).toBeTruthy();
    });
  });

  describe('entry point states', () => {
    it('shows tap-burst entry point state', async () => {
      await renderCatalog();
      const epLabels = screen.getAllByText('idle');
      expect(epLabels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('card counts', () => {
    it('does not show a count badge when there are no tap-burst cards', async () => {
      await renderCatalog([makeColorMixerCard('cm-1')]);
      const tapBurstSection = screen
        .getByText('Tap Burst')
        .closest('.catalog-entry');
      expect(tapBurstSection?.querySelector('.entry-active-count')).toBeNull();
    });

    it('shows the tap-burst count when cards are present', async () => {
      await renderCatalog([makeTapBurstCard('tb-1'), makeTapBurstCard('tb-2')]);
      const tapBurstSection = screen
        .getByText('Tap Burst')
        .closest('.catalog-entry');
      expect(
        tapBurstSection?.querySelector('.entry-active-count')?.textContent,
      ).toBe('2');
    });

    it('shows the color-mixer count when cards are present', async () => {
      await renderCatalog([makeColorMixerCard('cm-1')]);
      const cmSection = screen
        .getByText('Color Mixer')
        .closest('.catalog-entry');
      expect(cmSection?.querySelector('.entry-active-count')?.textContent).toBe(
        '1',
      );
    });
  });

  describe('"Add to dashboard" buttons', () => {
    it('calls addTapBurst when the Tap Burst button is clicked', async () => {
      const { mockStore } = await renderCatalog();
      const buttons = screen.getAllByRole('button', {
        name: '+ Add to dashboard',
      });
      fireEvent.click(buttons[0]);
      expect(mockStore.addTapBurst).toHaveBeenCalledOnce();
    });

    it('calls addColorMixer when the Color Mixer button is clicked', async () => {
      const { mockStore } = await renderCatalog();
      const buttons = screen.getAllByRole('button', {
        name: '+ Add to dashboard',
      });
      fireEvent.click(buttons[1]);
      expect(mockStore.addColorMixer).toHaveBeenCalledOnce();
    });

    it('keeps both buttons enabled at all times', async () => {
      await renderCatalog();
      const buttons = screen.getAllByRole('button', {
        name: '+ Add to dashboard',
      });
      expect((buttons[0] as HTMLButtonElement).disabled).toBe(false);
      expect((buttons[1] as HTMLButtonElement).disabled).toBe(false);
    });

    it('allows adding multiple views by clicking the button repeatedly', async () => {
      const { mockStore } = await renderCatalog();
      const buttons = screen.getAllByRole('button', {
        name: '+ Add to dashboard',
      });
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);
      expect(mockStore.addTapBurst).toHaveBeenCalledTimes(3);
    });
  });
});
