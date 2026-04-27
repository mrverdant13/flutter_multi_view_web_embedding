export const COLOR_MIXER_ENTRY_POINT_URL =
  '/flutter-packages/color-mixer-web-component/';

export type ColorChannel = 'r' | 'g' | 'b';

export interface ColorMixerInitialData {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface ColorMixerApi {
  /** Red channel of the current color (0.0–1.0). */
  readonly r: number;
  /** Green channel of the current color (0.0–1.0). */
  readonly g: number;
  /** Blue channel of the current color (0.0–1.0). */
  readonly b: number;
  /** Set the color (channels 0.0–1.0). */
  setColor(r: number, g: number, b: number): void;
  /** Assigned to register; invoked on every color change inside Flutter. */
  onColorChanged: ((r: number, g: number, b: number) => void) | null;
}
