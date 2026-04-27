import { vi } from 'vitest';
import { describeFlutterViewBase } from '@shared/testing/flutter-view-base.spec-helpers';
import { TapBurstFlutterViewComponent } from './tap-burst-flutter-view.component';
import type { TapBurstInitialData } from '../../models/tap-burst.types';

describeFlutterViewBase<unknown, TapBurstInitialData>(
  'TapBurstFlutterViewComponent',
  {
    component: TapBurstFlutterViewComponent,
    initialData: { particleCount: 5, burstDurationMs: 500 },
    stateReadyEvent:
      'flutter::tap_burst::tap-burst-view-controller-ready',
    widgetDataAttribute: 'tap_burst',
    makeMockController: () => ({
      particleCount: 5,
      burstDuration: 500,
      onParticleCountChanged: null,
      onBurstDurationChanged: null,
    }),
  },
);
