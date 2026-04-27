import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ColorChannel, ColorMixerApi } from '../models/color-mixer.types';

export function withColorMixerView() {
  return signalStoreFeature(
    withState({ r: 0, g: 0, b: 0, api: null as ColorMixerApi | null }),
    withMethods((store) => ({
      initFromController(api: ColorMixerApi): void {
        patchState(store, { r: api.r, g: api.g, b: api.b });
        api.onColorChanged = (r, g, b) => patchState(store, { r, g, b });
        patchState(store, { api });
      },
      setChannel(channel: ColorChannel, value: number): void {
        switch (channel) {
          case 'r':
            patchState(store, { r: value });
            break;
          case 'g':
            patchState(store, { g: value });
            break;
          case 'b':
            patchState(store, { b: value });
            break;
        }
        store.api()?.setColor(store.r(), store.g(), store.b());
      },
    })),
  );
}
