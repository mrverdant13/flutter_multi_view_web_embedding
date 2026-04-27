import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TapBurstViewStore } from './tap-burst-view.store';
import type { TapBurstApi } from '../models/tap-burst.types';

function makeApi(particleCount: number, burstDuration: number): TapBurstApi {
  return {
    particleCount,
    burstDuration,
    onParticleCountChanged: null,
    onBurstDurationChanged: null,
  };
}

describe('TapBurstViewStore', () => {
  let store: InstanceType<typeof TapBurstViewStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), TapBurstViewStore],
    });
    store = TestBed.inject(TapBurstViewStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('starts with null api and zero values', () => {
    expect(store.api()).toBeNull();
    expect(store.particleCount()).toBe(0);
    expect(store.burstDuration()).toBe(0);
  });

  describe('initFromController', () => {
    it('reads initial values from the api', () => {
      store.initFromController(makeApi(50, 1200));
      expect(store.particleCount()).toBe(50);
      expect(store.burstDuration()).toBe(1200);
    });

    it('stores the api reference', () => {
      const api = makeApi(10, 800);
      store.initFromController(api);
      expect(store.api()).toBe(api);
    });

    it('registers onParticleCountChanged — Flutter callback updates store', () => {
      const api = makeApi(10, 800);
      store.initFromController(api);
      api.onParticleCountChanged?.(99);
      expect(store.particleCount()).toBe(99);
    });

    it('registers onBurstDurationChanged — Flutter callback updates store', () => {
      const api = makeApi(10, 800);
      store.initFromController(api);
      api.onBurstDurationChanged?.(3000);
      expect(store.burstDuration()).toBe(3000);
    });
  });

  describe('setParticleCount', () => {
    it('updates store signal immediately', () => {
      store.setParticleCount(75);
      expect(store.particleCount()).toBe(75);
    });

    it('writes to api when api is present', () => {
      const api = makeApi(10, 800);
      store.initFromController(api);
      store.setParticleCount(75);
      expect(api.particleCount).toBe(75);
    });

    it('updates store signal even when api is null', () => {
      store.setParticleCount(50);
      expect(store.particleCount()).toBe(50);
    });
  });

  describe('setBurstDuration', () => {
    it('updates store signal immediately', () => {
      store.setBurstDuration(2000);
      expect(store.burstDuration()).toBe(2000);
    });

    it('writes to api when api is present', () => {
      const api = makeApi(10, 800);
      store.initFromController(api);
      store.setBurstDuration(2000);
      expect(api.burstDuration).toBe(2000);
    });

    it('updates store signal even when api is null', () => {
      store.setBurstDuration(1000);
      expect(store.burstDuration()).toBe(1000);
    });
  });
});
