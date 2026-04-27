import { render, screen, fireEvent } from '@testing-library/angular';
import {
  Component,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { WidgetCardComponent } from './widget-card.component';
import { DashboardStore } from '../../stores/dashboard.store';
import type { DashboardCard } from '../../stores/dashboard.store';
import type { TapBurstInitialData } from '@tap-burst';
import type { ColorMixerInitialData } from '@color-mixer';

@Component({ selector: 'app-tap-burst-view', standalone: true, template: '' })
class TapBurstViewStub {
  readonly initialData = input<TapBurstInitialData>();
  readonly state = signal<{ status: string }>({ status: 'loading' });
}

@Component({ selector: 'app-color-mixer-view', standalone: true, template: '' })
class ColorMixerViewStub {
  readonly initialData = input<ColorMixerInitialData>();
  readonly state = signal<{ status: string }>({ status: 'loading' });
}

function makeMockStore(
  overrides: Partial<InstanceType<typeof DashboardStore>> = {},
) {
  return {
    onCardReady: vi.fn(),
    onCardError: vi.fn(),
    removeCard: vi.fn(),
    cards: vi.fn().mockReturnValue([]),
    ...overrides,
  };
}

const TAP_BURST_CARD: DashboardCard = {
  type: 'tap-burst',
  id: 'card-1',
  initialData: { particleCount: 10, burstDurationMs: 800 },
};

const COLOR_MIXER_CARD: DashboardCard = {
  type: 'color-mixer',
  id: 'card-2',
  initialData: { r: 0.5, g: 0.5, b: 0.5 },
};

async function renderCard(card: DashboardCard, index = 1) {
  TestBed.overrideComponent(WidgetCardComponent, {
    set: { imports: [TapBurstViewStub, ColorMixerViewStub] },
  });
  const mockStore = makeMockStore();
  const { fixture } = await render(WidgetCardComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: DashboardStore, useValue: mockStore },
    ],
    componentInputs: { card, cardIndex: index },
  });
  return { mockStore, fixture };
}

describe('WidgetCardComponent', () => {
  describe('type label', () => {
    it('shows "Tap Burst" for tap-burst cards', async () => {
      await renderCard(TAP_BURST_CARD);
      expect(screen.getByText('Tap Burst')).toBeTruthy();
    });

    it('shows "Color Mixer" for color-mixer cards', async () => {
      await renderCard(COLOR_MIXER_CARD);
      expect(screen.getByText('Color Mixer')).toBeTruthy();
    });
  });

  describe('index label', () => {
    it('pads the index to two digits with #', async () => {
      await renderCard(TAP_BURST_CARD, 3);
      expect(screen.getByText('#03')).toBeTruthy();
    });

    it('formats two-digit indices correctly', async () => {
      await renderCard(TAP_BURST_CARD, 12);
      expect(screen.getByText('#12')).toBeTruthy();
    });
  });

  describe('remove button', () => {
    it('calls store.removeCard with the card id', async () => {
      const { mockStore } = await renderCard(TAP_BURST_CARD);
      fireEvent.click(screen.getByRole('button', { name: 'Remove widget' }));
      expect(mockStore.removeCard).toHaveBeenCalledWith('card-1');
    });
  });

  describe('child view', () => {
    it('renders the tap-burst view stub for tap-burst cards', async () => {
      await renderCard(TAP_BURST_CARD);
      expect(document.querySelector('app-tap-burst-view')).toBeTruthy();
      expect(document.querySelector('app-color-mixer-view')).toBeNull();
    });

    it('renders the color-mixer view stub for color-mixer cards', async () => {
      await renderCard(COLOR_MIXER_CARD);
      expect(document.querySelector('app-color-mixer-view')).toBeTruthy();
      expect(document.querySelector('app-tap-burst-view')).toBeNull();
    });
  });

  describe('computed narrow helpers', () => {
    it('asTapBurst returns null for a color-mixer card', async () => {
      const { fixture } = await renderCard(COLOR_MIXER_CARD);
      interface WithHelpers {
        asTapBurst: () => unknown;
      }
      expect(
        (fixture.componentInstance as unknown as WithHelpers).asTapBurst(),
      ).toBeNull();
    });

    it('asColorMixer returns null for a tap-burst card', async () => {
      const { fixture } = await renderCard(TAP_BURST_CARD);
      interface WithHelpers {
        asColorMixer: () => unknown;
      }
      expect(
        (fixture.componentInstance as unknown as WithHelpers).asColorMixer(),
      ).toBeNull();
    });
  });

  describe('lifecycle callbacks', () => {
    it('calls store.onCardReady when the active view state becomes ready', async () => {
      const { mockStore, fixture } = await renderCard(TAP_BURST_CARD);
      const stub = fixture.debugElement.query(By.directive(TapBurstViewStub))
        .componentInstance as TapBurstViewStub;
      stub.state.set({ status: 'ready' });
      TestBed.flushEffects();
      expect(mockStore.onCardReady).toHaveBeenCalledWith('card-1');
    });

    it('calls store.onCardError when the active view state becomes error', async () => {
      const { mockStore, fixture } = await renderCard(TAP_BURST_CARD);
      const stub = fixture.debugElement.query(By.directive(TapBurstViewStub))
        .componentInstance as TapBurstViewStub;
      stub.state.set({ status: 'error' });
      TestBed.flushEffects();
      expect(mockStore.onCardError).toHaveBeenCalledWith('card-1');
    });
  });
});
