import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorMixerViewStore } from './color-mixer-view.store';
import type { ColorMixerApi } from '../models/color-mixer.types';

function makeApi(r: number, g: number, b: number): ColorMixerApi {
  return { r, g, b, setColor: vi.fn(), onColorChanged: null };
}

describe('ColorMixerViewStore', () => {
  let store: InstanceType<typeof ColorMixerViewStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ColorMixerViewStore],
    });
    store = TestBed.inject(ColorMixerViewStore);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('starts with null api and zero channels', () => {
    expect(store.api()).toBeNull();
    expect(store.r()).toBe(0);
    expect(store.g()).toBe(0);
    expect(store.b()).toBe(0);
  });

  describe('initFromController', () => {
    it('reads initial rgb values from api', () => {
      store.initFromController(makeApi(0.2, 0.4, 0.6));
      expect(store.r()).toBeCloseTo(0.2);
      expect(store.g()).toBeCloseTo(0.4);
      expect(store.b()).toBeCloseTo(0.6);
    });

    it('stores the api reference', () => {
      const api = makeApi(0, 0, 0);
      store.initFromController(api);
      expect(store.api()).toBe(api);
    });

    it('registers onColorChanged — Flutter callback updates all channels', () => {
      const api = makeApi(0, 0, 0);
      store.initFromController(api);
      api.onColorChanged?.(0.1, 0.5, 0.9);
      expect(store.r()).toBeCloseTo(0.1);
      expect(store.g()).toBeCloseTo(0.5);
      expect(store.b()).toBeCloseTo(0.9);
    });
  });

  describe('setChannel', () => {
    it.each(['r', 'g', 'b'] as const)(
      'updates the %s channel in store state',
      (ch) => {
        const api = makeApi(0, 0, 0);
        store.initFromController(api);
        store.setChannel(ch, 0.7);
        expect(store[ch]()).toBeCloseTo(0.7);
      },
    );

    it('calls api.setColor with updated channel and current others', () => {
      const api = makeApi(0.1, 0.2, 0.3);
      store.initFromController(api);
      store.setChannel('r', 0.8);
      expect(api.setColor).toHaveBeenCalledWith(0.8, 0.2, 0.3);
    });

    it('calls api.setColor with all channels after g update', () => {
      const api = makeApi(0.1, 0.2, 0.3);
      store.initFromController(api);
      store.setChannel('g', 0.9);
      expect(api.setColor).toHaveBeenCalledWith(0.1, 0.9, 0.3);
    });

    it('calls api.setColor with all channels after b update', () => {
      const api = makeApi(0.1, 0.2, 0.3);
      store.initFromController(api);
      store.setChannel('b', 0.5);
      expect(api.setColor).toHaveBeenCalledWith(0.1, 0.2, 0.5);
    });

    it('does nothing when api is null', () => {
      expect(() => store.setChannel('r', 0.5)).not.toThrow();
    });
  });
});
