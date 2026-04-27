import { Component, input, output } from '@angular/core';
import {
  BURST_DURATION_MAX,
  BURST_DURATION_MIN,
  PARTICLE_COUNT_MAX,
  PARTICLE_COUNT_MIN,
} from '../../models/tap-burst.types';

export type TapBurstControlPanelType = 'config' | 'control';

@Component({
  selector: 'app-tap-burst-control-panel',
  standalone: true,
  templateUrl: './tap-burst-control-panel.component.html',
  styleUrl: './tap-burst-control-panel.component.css',
})
export class TapBurstControlPanelComponent {
  readonly type = input.required<TapBurstControlPanelType>();
  readonly particleCount = input.required<number>();
  readonly burstDuration = input.required<number>();

  readonly particleCountChange = output<number>();
  readonly burstDurationChange = output<number>();

  protected readonly particleCountMin = PARTICLE_COUNT_MIN;
  protected readonly particleCountMax = PARTICLE_COUNT_MAX;
  protected readonly burstDurationMin = BURST_DURATION_MIN;
  protected readonly burstDurationMax = BURST_DURATION_MAX;

  onParticleCountInput(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    if (!el) return;
    const val = parseInt(el.value, 10);
    if (!isNaN(val)) this.particleCountChange.emit(val);
  }

  onBurstDurationInput(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    if (!el) return;
    const val = parseInt(el.value, 10);
    if (!isNaN(val)) this.burstDurationChange.emit(val);
  }
}
