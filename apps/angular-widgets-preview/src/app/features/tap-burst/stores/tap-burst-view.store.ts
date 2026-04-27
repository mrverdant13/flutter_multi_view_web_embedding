import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { TapBurstApi } from '../models/tap-burst.types';

export const TapBurstViewStore = signalStore(
  withState({
    api: null as TapBurstApi | null,
    particleCount: 0,
    burstDuration: 0,
  }),
  withMethods((store) => ({
    initFromController(api: TapBurstApi): void {
      patchState(store, {
        particleCount: api.particleCount,
        burstDuration: api.burstDuration,
      });
      api.onParticleCountChanged = (n) =>
        patchState(store, { particleCount: n });
      api.onBurstDurationChanged = (ms) =>
        patchState(store, { burstDuration: ms });
      patchState(store, { api });
    },
    setParticleCount(value: number): void {
      patchState(store, { particleCount: value });
      const api = store.api();
      if (api) api.particleCount = value;
    },
    setBurstDuration(value: number): void {
      patchState(store, { burstDuration: value });
      const api = store.api();
      if (api) api.burstDuration = value;
    },
  })),
);

export type TapBurstViewStore = InstanceType<typeof TapBurstViewStore>;
