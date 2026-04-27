import { Component, ElementRef, viewChild } from '@angular/core';
import { FlutterViewBase } from '@shared/components/flutter-view.base';
import {
  TAP_BURST_ENTRY_POINT_URL,
  TapBurstApi,
  TapBurstInitialData,
} from '../../models/tap-burst.types';

@Component({
  selector: 'app-tap-burst-flutter-view',
  standalone: true,
  templateUrl: './tap-burst-flutter-view.component.html',
  styleUrls: [
    '../../../../shared/styles/flutter-view.component.css',
    './tap-burst-flutter-view.component.css',
  ],
})
export class TapBurstFlutterViewComponent extends FlutterViewBase<
  TapBurstApi,
  TapBurstInitialData
> {
  protected override readonly hostRef =
    viewChild.required<ElementRef<HTMLElement>>('flutterHost');

  protected override readonly entryPointBaseUrl = TAP_BURST_ENTRY_POINT_URL;
  protected override readonly assetBaseUrl = TAP_BURST_ENTRY_POINT_URL;
  protected override readonly stateReadyEvent =
    'flutter::tap_burst::tap-burst-view-controller-ready';
}
