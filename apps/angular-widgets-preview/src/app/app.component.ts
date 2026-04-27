import { Component, computed, inject } from '@angular/core';
import { DashboardStore } from './features/dashboard/stores/dashboard.store';
import { WidgetCatalogComponent } from './features/dashboard/components/widget-catalog/widget-catalog.component';
import { WidgetCardComponent } from './features/dashboard/components/widget-card/widget-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WidgetCatalogComponent, WidgetCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly store = inject(DashboardStore);

  protected readonly totalCount = computed(() => this.store.cards().length);
}
