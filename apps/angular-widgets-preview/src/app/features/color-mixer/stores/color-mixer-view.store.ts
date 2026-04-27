import { signalStore } from '@ngrx/signals';
import { withColorMixerView } from './with-color-mixer-view.feature';

export const ColorMixerViewStore = signalStore(withColorMixerView());

export type ColorMixerViewStore = InstanceType<typeof ColorMixerViewStore>;
