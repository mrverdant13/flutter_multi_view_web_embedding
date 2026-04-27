import {
  Component,
  Signal,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { TapBurstApi, TapBurstInitialData } from '../../models/tap-burst.types';
import { TapBurstFlutterViewComponent } from '../tap-burst-flutter-view/tap-burst-flutter-view.component';
import { TapBurstControlPanelComponent } from '../tap-burst-control-panel/tap-burst-control-panel.component';
import { TapBurstViewStore } from '../../stores/tap-burst-view.store';
import { FlutterViewState } from '@shared/components/flutter-view.base';

@Component({
  selector: 'app-tap-burst-view',
  standalone: true,
  imports: [TapBurstFlutterViewComponent, TapBurstControlPanelComponent],
  host: { class: 'view-wrapper' },
  templateUrl: './tap-burst-view.component.html',
  styleUrl: '../../../../shared/styles/view.component.css',
  providers: [TapBurstViewStore],
})
export class TapBurstViewComponent {
  readonly initialData = input.required<TapBurstInitialData>();

  protected readonly store = inject(TapBurstViewStore);

  private readonly flutterViewRef = viewChild.required<{
    state: Signal<FlutterViewState<TapBurstApi>>;
  }>('flutterView');

  readonly state = computed(() => this.flutterViewRef().state());

  constructor() {
    effect(() => {
      const s = this.state();
      if (s.status === 'ready') this.store.initFromController(s.controller);
    });
  }
}
