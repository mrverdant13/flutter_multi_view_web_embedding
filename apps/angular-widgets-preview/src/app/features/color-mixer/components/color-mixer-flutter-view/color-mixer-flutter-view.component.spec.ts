import { vi } from 'vitest';
import { describeFlutterViewBase } from '@shared/testing/flutter-view-base.spec-helpers';
import { ColorMixerFlutterViewComponent } from './color-mixer-flutter-view.component';
import type { ColorMixerInitialData } from '../../models/color-mixer.types';

describeFlutterViewBase<unknown, ColorMixerInitialData>(
  'ColorMixerFlutterViewComponent',
  {
    component: ColorMixerFlutterViewComponent,
    initialData: { r: 0.5, g: 0.5, b: 0.5 },
    stateReadyEvent:
      'flutter::color_mixer::color-mixer-view-controller-ready',
    widgetDataAttribute: 'color_mixer',
    makeMockController: () => ({
      r: 0.5,
      g: 0.5,
      b: 0.5,
      setColor: vi.fn(),
      onColorChanged: null,
    }),
  },
);
