import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStore } from './dashboard.store';
import { FlutterBootstrapService } from '@core/services/flutter-bootstrap.service';
import type { FlutterAppState } from '@core/services/flutter-bootstrap.service';
import { TAP_BURST_ENTRY_POINT_URL } from '@tap-burst';

describe('DashboardStore', () => {
  let store: InstanceType<typeof DashboardStore>;
  let tbAppState: ReturnType<typeof signal<FlutterAppState>>;
  let cmAppState: ReturnType<typeof signal<FlutterAppState>>;

  beforeEach(() => {
    tbAppState = signal<FlutterAppState>({ state: 'idle' });
    cmAppState = signal<FlutterAppState>({ state: 'idle' });

    const mockBootstrap = {
      appStateSignal: vi
        .fn()
        .mockImplementation((url: string) =>
          url === TAP_BURST_ENTRY_POINT_URL
            ? tbAppState.asReadonly()
            : cmAppState.asReadonly(),
        ),
      bootstrapStatus: signal('idle').asReadonly(),
      loadApp: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DashboardStore,
        { provide: FlutterBootstrapService, useValue: mockBootstrap },
      ],
    });
    store = TestBed.inject(DashboardStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('initial state', () => {
    it('has no cards', () => {
      expect(store.cards()).toEqual([]);
    });

    it('isAdding is false', () => {
      expect(store.isAdding()).toBe(false);
    });

    it('has default tap-burst config values', () => {
      expect(store.tbParticleCount()).toBe(10);
      expect(store.tbBurstDuration()).toBe(800);
    });

    it('has default color-mixer config values at 0.5 each', () => {
      expect(store.cmR()).toBeCloseTo(0.5);
      expect(store.cmG()).toBeCloseTo(0.5);
      expect(store.cmB()).toBeCloseTo(0.5);
    });
  });

  describe('addTapBurst', () => {
    it('adds a tap-burst card', () => {
      store.addTapBurst();
      expect(store.cards()).toHaveLength(1);
      expect(store.cards()[0].type).toBe('tap-burst');
    });

    it('initialData matches current config values', () => {
      store.setTbParticleCount(30);
      store.setTbBurstDuration(1500);
      store.addTapBurst();
      const card = store.cards()[0];
      if (card.type !== 'tap-burst') throw new Error('wrong type');
      expect(card.initialData.particleCount).toBe(30);
      expect(card.initialData.burstDurationMs).toBe(1500);
    });

    it('sets isAdding to true', () => {
      store.addTapBurst();
      expect(store.isAdding()).toBe(true);
    });

    it('assigns a unique id to each card', () => {
      store.addTapBurst();
      store.addTapBurst();
      const ids = store.cards().map((c) => c.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('keeps isAdding true until all added cards are ready', () => {
      store.addTapBurst();
      store.addTapBurst();
      const [id1, id2] = store.cards().map((c) => c.id);
      store.onCardReady(id1);
      expect(store.isAdding()).toBe(true);
      store.onCardReady(id2);
      expect(store.isAdding()).toBe(false);
    });
  });

  describe('addColorMixer', () => {
    it('adds a color-mixer card', () => {
      store.addColorMixer();
      expect(store.cards()).toHaveLength(1);
      expect(store.cards()[0].type).toBe('color-mixer');
    });

    it('initialData matches current config values', () => {
      store.setCmChannel('r', 0.1);
      store.setCmChannel('g', 0.6);
      store.setCmChannel('b', 0.9);
      store.addColorMixer();
      const card = store.cards()[0];
      if (card.type !== 'color-mixer') throw new Error('wrong type');
      expect(card.initialData.r).toBeCloseTo(0.1);
      expect(card.initialData.g).toBeCloseTo(0.6);
      expect(card.initialData.b).toBeCloseTo(0.9);
    });

    it('sets isAdding to true', () => {
      store.addColorMixer();
      expect(store.isAdding()).toBe(true);
    });
  });

  describe('removeCard', () => {
    it('removes the card by id', () => {
      store.addTapBurst();
      const id = store.cards()[0].id;
      store.removeCard(id);
      expect(store.cards()).toHaveLength(0);
    });

    it('does not remove other cards', () => {
      store.addTapBurst();
      store.addColorMixer();
      const first = store.cards()[0].id;
      store.removeCard(first);
      expect(store.cards()).toHaveLength(1);
      expect(store.cards()[0].type).toBe('color-mixer');
    });

    it('clears the card from adding state when removed', () => {
      store.addTapBurst();
      const id = store.cards()[0].id;
      expect(store.isAdding()).toBe(true);
      store.removeCard(id);
      expect(store.isAdding()).toBe(false);
    });

    it('does not affect adding state when removing a card that is not being added', () => {
      store.addTapBurst();
      const firstId = store.cards()[0].id;
      store.onCardReady(firstId);
      store.addColorMixer();

      store.removeCard(firstId);
      expect(store.isAdding()).toBe(true);
    });
  });

  describe('onCardReady', () => {
    it('clears the card from adding state when the id matches', () => {
      store.addTapBurst();
      const id = store.cards()[0].id;
      store.onCardReady(id);
      expect(store.isAdding()).toBe(false);
    });

    it('is a no-op when the id does not match', () => {
      store.addTapBurst();
      store.onCardReady('unrelated-id');
      expect(store.isAdding()).toBe(true);
    });

    it('is a no-op when nothing is being added', () => {
      expect(() => store.onCardReady('any-id')).not.toThrow();
    });

    it('leaves other cards in adding state when only one resolves', () => {
      store.addTapBurst();
      store.addTapBurst();
      const [id1] = store.cards().map((c) => c.id);
      store.onCardReady(id1);
      expect(store.isAdding()).toBe(true);
    });
  });

  describe('onCardError', () => {
    it('clears the card from adding state when the id matches', () => {
      store.addTapBurst();
      const id = store.cards()[0].id;
      store.onCardError(id);
      expect(store.isAdding()).toBe(false);
    });

    it('is a no-op when the id does not match', () => {
      store.addTapBurst();
      store.onCardError('unrelated-id');
      expect(store.isAdding()).toBe(true);
    });
  });

  describe('setTbParticleCount', () => {
    it('accepts values within range', () => {
      store.setTbParticleCount(100);
      expect(store.tbParticleCount()).toBe(100);
    });

    it('clamps below minimum to 1', () => {
      store.setTbParticleCount(0);
      expect(store.tbParticleCount()).toBe(1);
    });

    it('clamps above maximum to 200', () => {
      store.setTbParticleCount(999);
      expect(store.tbParticleCount()).toBe(200);
    });
  });

  describe('setTbBurstDuration', () => {
    it('accepts values within range', () => {
      store.setTbBurstDuration(2000);
      expect(store.tbBurstDuration()).toBe(2000);
    });

    it('clamps below minimum to 100', () => {
      store.setTbBurstDuration(50);
      expect(store.tbBurstDuration()).toBe(100);
    });

    it('clamps above maximum to 5000', () => {
      store.setTbBurstDuration(9999);
      expect(store.tbBurstDuration()).toBe(5000);
    });
  });

  describe('setCmChannel', () => {
    it.each(['r', 'g', 'b'] as const)('updates the %s channel', (ch) => {
      store.setCmChannel(ch, 0.3);
      const key = `cm${ch.toUpperCase()}` as 'cmR' | 'cmG' | 'cmB';
      expect(store[key]()).toBeCloseTo(0.3);
    });

    it('clamps below 0 to 0', () => {
      store.setCmChannel('r', -1);
      expect(store.cmR()).toBe(0);
    });

    it('clamps above 1 to 1', () => {
      store.setCmChannel('g', 2);
      expect(store.cmG()).toBe(1);
    });
  });

  describe('tapBurstEpState', () => {
    it('is idle when app state is idle and nothing is being added', () => {
      expect(store.tapBurstEpState()).toBe('idle');
    });

    it('reflects app state signal when not idle', () => {
      tbAppState.set({ state: 'loading' });
      expect(store.tapBurstEpState()).toBe('loading');

      tbAppState.set({
        state: 'ready',
        app: { addView: vi.fn(), removeView: vi.fn() },
      });
      expect(store.tapBurstEpState()).toBe('ready');

      tbAppState.set({ state: 'error' });
      expect(store.tapBurstEpState()).toBe('error');
    });

    it('returns loading when a tap-burst card is being added and app is still idle', () => {
      store.addTapBurst();
      expect(store.tapBurstEpState()).toBe('loading');
    });

    it('stays loading while any tap-burst card is still being added', () => {
      store.addTapBurst();
      store.addTapBurst();
      const [id1] = store.cards().map((c) => c.id);
      store.onCardReady(id1);
      expect(store.tapBurstEpState()).toBe('loading');
    });

    it('does not return loading when a color-mixer card is being added', () => {
      store.addColorMixer();
      expect(store.tapBurstEpState()).toBe('idle');
    });
  });

  describe('colorMixerEpState', () => {
    it('is idle when nothing is being added', () => {
      expect(store.colorMixerEpState()).toBe('idle');
    });

    it('reflects app state signal when not idle', () => {
      cmAppState.set({
        state: 'ready',
        app: { addView: vi.fn(), removeView: vi.fn() },
      });
      expect(store.colorMixerEpState()).toBe('ready');
    });

    it('returns loading when a color-mixer card is being added and app is still idle', () => {
      store.addColorMixer();
      expect(store.colorMixerEpState()).toBe('loading');
    });
  });
});
