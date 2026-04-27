import {
  Component,
  Signal,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ColorMixerApi,
  ColorMixerInitialData,
} from '../../models/color-mixer.types';
import { ColorMixerFlutterViewComponent } from '../color-mixer-flutter-view/color-mixer-flutter-view.component';
import { ColorMixerControlPanelComponent } from '../color-mixer-control-panel/color-mixer-control-panel.component';
import { ColorMixerViewStore } from '../../stores/color-mixer-view.store';
import { FlutterViewState } from '@shared/components/flutter-view.base';

@Component({
  selector: 'app-color-mixer-view',
  standalone: true,
  imports: [ColorMixerFlutterViewComponent, ColorMixerControlPanelComponent],
  host: { class: 'view-wrapper' },
  templateUrl: './color-mixer-view.component.html',
  styleUrl: '../../../../shared/styles/view.component.css',
  providers: [ColorMixerViewStore],
})
export class ColorMixerViewComponent {
  readonly initialData = input.required<ColorMixerInitialData>();

  protected readonly store = inject(ColorMixerViewStore);

  private readonly flutterViewRef = viewChild.required<{
    state: Signal<FlutterViewState<ColorMixerApi>>;
  }>('flutterView');

  readonly state = computed(() => this.flutterViewRef().state());

  constructor() {
    effect(() => {
      const s = this.state();
      if (s.status === 'ready') this.store.initFromController(s.controller);
    });
  }
}
