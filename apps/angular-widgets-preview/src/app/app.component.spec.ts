import { render, screen } from '@testing-library/angular';
import {
  Component,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';
import { DashboardStore } from './features/dashboard/stores/dashboard.store';
import type { DashboardCard } from './features/dashboard/stores/dashboard.store';

@Component({ selector: 'app-widget-catalog', standalone: true, template: '' })
class WidgetCatalogStub {}

@Component({ selector: 'app-widget-card', standalone: true, template: '' })
class WidgetCardStub {
  readonly card = input<DashboardCard>();
  readonly cardIndex = input<number>();
}

function makeMockStore(cards: DashboardCard[] = []) {
  return { cards: signal(cards).asReadonly() };
}

async function renderApp(cards: DashboardCard[] = []) {
  TestBed.overrideComponent(AppComponent, {
    set: { imports: [WidgetCatalogStub, WidgetCardStub] },
  });
  const mockStore = makeMockStore(cards);
  await render(AppComponent, {
    providers: [
      provideZonelessChangeDetection(),
      { provide: DashboardStore, useValue: mockStore },
    ],
  });
  return { mockStore };
}

const TB_CARD: DashboardCard = {
  type: 'tap-burst',
  id: 'tb-1',
  initialData: { particleCount: 10, burstDurationMs: 800 },
};
const CM_CARD: DashboardCard = {
  type: 'color-mixer',
  id: 'cm-1',
  initialData: { r: 0.5, g: 0.5, b: 0.5 },
};

describe('AppComponent', () => {
  describe('brand', () => {
    it('shows "Flutter Dashboard" in the topbar', async () => {
      await renderApp();
      expect(screen.getByText('Flutter Dashboard')).toBeTruthy();
    });
  });

  describe('widget count badge', () => {
    it('hides the count badge when there are no cards', async () => {
      await renderApp([]);
      expect(document.querySelector('.widget-count')).toBeNull();
    });

    it('shows count and "widget" (singular) with 1 card', async () => {
      await renderApp([TB_CARD]);
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('widget')).toBeTruthy();
    });

    it('shows count and "widgets" (plural) with 2 cards', async () => {
      await renderApp([TB_CARD, CM_CARD]);
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('widgets')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('shows the empty state when there are no cards', async () => {
      await renderApp([]);
      expect(screen.getByText('No widgets yet')).toBeTruthy();
    });

    it('hides the empty state when there are cards', async () => {
      await renderApp([TB_CARD]);
      expect(screen.queryByText('No widgets yet')).toBeNull();
    });
  });

  describe('card grid', () => {
    it('renders one widget-card stub per card', async () => {
      await renderApp([TB_CARD, CM_CARD]);
      expect(document.querySelectorAll('app-widget-card').length).toBe(2);
    });
  });
});
