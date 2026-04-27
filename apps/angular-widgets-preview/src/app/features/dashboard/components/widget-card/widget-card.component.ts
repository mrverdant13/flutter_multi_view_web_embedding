import {
  Component,
  Signal,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DashboardCard, DashboardStore } from '../../stores/dashboard.store';
import { TapBurstViewComponent } from '@tap-burst';
import { ColorMixerViewComponent } from '@color-mixer';

interface WithViewState {
  state: Signal<{ status: string }>;
}

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [TapBurstViewComponent, ColorMixerViewComponent],
  templateUrl: './widget-card.component.html',
  styleUrl: './widget-card.component.css',
  host: { '[attr.data-type]': 'card().type' },
})
export class WidgetCardComponent {
  readonly card = input.required<DashboardCard>();
  readonly cardIndex = input.required<number>();

  protected readonly store = inject(DashboardStore);

  protected readonly typeLabel = computed(() => {
    switch (this.card().type) {
      case 'tap-burst':
        return 'Tap Burst';
      case 'color-mixer':
        return 'Color Mixer';
    }
  });

  protected readonly indexLabel = computed(
    () => `#${String(this.cardIndex()).padStart(2, '0')}`,
  );

  protected readonly asTapBurst = computed(() => {
    const c = this.card();
    return c.type === 'tap-burst' ? c : null;
  });

  protected readonly asColorMixer = computed(() => {
    const c = this.card();
    return c.type === 'color-mixer' ? c : null;
  });

  private readonly activeViewRef = viewChild<WithViewState>('activeView');

  constructor() {
    effect(() => {
      const status = this.activeViewRef()?.state().status;
      if (status === 'ready') this.store.onCardReady(this.card().id);
      else if (status === 'error') this.store.onCardError(this.card().id);
    });
  }

  remove(): void {
    this.store.removeCard(this.card().id);
  }
}
