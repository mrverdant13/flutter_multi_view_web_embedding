import { Component, ElementRef, viewChild } from '@angular/core';
import { FlutterViewBase } from '@shared/components/flutter-view.base';
import {
  COLOR_MIXER_ENTRY_POINT_URL,
  ColorMixerApi,
  ColorMixerInitialData,
} from '../../models/color-mixer.types';

@Component({
  selector: 'app-color-mixer-flutter-view',
  standalone: true,
  templateUrl: './color-mixer-flutter-view.component.html',
  styleUrls: [
    '../../../../shared/styles/flutter-view.component.css',
    './color-mixer-flutter-view.component.css',
  ],
})
export class ColorMixerFlutterViewComponent extends FlutterViewBase<
  ColorMixerApi,
  ColorMixerInitialData
> {
  protected override readonly hostRef =
    viewChild.required<ElementRef<HTMLElement>>('flutterHost');

  protected override readonly entryPointBaseUrl = COLOR_MIXER_ENTRY_POINT_URL;
  protected override readonly assetBaseUrl = COLOR_MIXER_ENTRY_POINT_URL;
  protected override readonly stateReadyEvent =
    'flutter::color_mixer::color-mixer-view-controller-ready';
}
