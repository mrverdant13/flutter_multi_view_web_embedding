import { Component, computed, inject } from '@angular/core';
import { DashboardCard, DashboardStore } from '../../stores/dashboard.store';
import { TapBurstControlPanelComponent } from '@tap-burst';
import { ColorMixerControlPanelComponent } from '@color-mixer';

@Component({
  selector: 'app-widget-catalog',
  standalone: true,
  imports: [TapBurstControlPanelComponent, ColorMixerControlPanelComponent],
  templateUrl: './widget-catalog.component.html',
  styleUrl: './widget-catalog.component.css',
})
export class WidgetCatalogComponent {
  protected readonly store = inject(DashboardStore);

  protected readonly cardCounts = computed<
    Record<DashboardCard['type'], number>
  >(() =>
    this.store.cards().reduce(
      (acc, c) => {
        acc[c.type]++;
        return acc;
      },
      { 'tap-burst': 0, 'color-mixer': 0 },
    ),
  );

  protected readonly tapBurstCount = computed(
    () => this.cardCounts()['tap-burst'],
  );

  protected readonly colorMixerCount = computed(
    () => this.cardCounts()['color-mixer'],
  );

  protected readonly bootstrapStateLabel = this.store.bootstrapStatus;

  protected readonly tapBurstStateLabel = this.store.tapBurstEpState;

  protected readonly colorMixerStateLabel = this.store.colorMixerEpState;
}
