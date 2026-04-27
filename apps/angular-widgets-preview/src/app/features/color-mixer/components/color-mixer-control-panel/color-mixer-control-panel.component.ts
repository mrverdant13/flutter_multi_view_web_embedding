import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { ColorChannel } from '../../models/color-mixer.types';
import { rgbToHex, sliderGradient, toInt255 } from '../../utils/color-utils';

export type ColorMixerControlPanelType = 'config' | 'control';

@Component({
  selector: 'app-color-mixer-control-panel',
  standalone: true,
  templateUrl: './color-mixer-control-panel.component.html',
  styleUrl: './color-mixer-control-panel.component.css',
})
export class ColorMixerControlPanelComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  readonly type = input.required<ColorMixerControlPanelType>();
  readonly r = input.required<number>();
  readonly g = input.required<number>();
  readonly b = input.required<number>();

  readonly rChange = output<number>();
  readonly gChange = output<number>();
  readonly bChange = output<number>();

  protected readonly hex = computed(() =>
    rgbToHex(this.r(), this.g(), this.b()),
  );
  protected readonly rInt = computed(() => toInt255(this.r()));
  protected readonly gInt = computed(() => toInt255(this.g()));
  protected readonly bInt = computed(() => toInt255(this.b()));

  constructor() {
    effect(() => {
      const host = this.el.nativeElement as HTMLElement;
      const r = this.r(),
        g = this.g(),
        b = this.b();
      const rg = sliderGradient('r', r, g, b);
      const gg = sliderGradient('g', r, g, b);
      const bg = sliderGradient('b', r, g, b);
      host.style.setProperty('--r-from', rg['--from-color']);
      host.style.setProperty('--r-to', rg['--to-color']);
      host.style.setProperty('--g-from', gg['--from-color']);
      host.style.setProperty('--g-to', gg['--to-color']);
      host.style.setProperty('--b-from', bg['--from-color']);
      host.style.setProperty('--b-to', bg['--to-color']);
    });
  }

  onSliderInput(event: Event, channel: ColorChannel): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (isNaN(val)) return;
    switch (channel) {
      case 'r':
        this.rChange.emit(val);
        break;
      case 'g':
        this.gChange.emit(val);
        break;
      case 'b':
        this.bChange.emit(val);
        break;
    }
  }
}
