import { ColorChannel } from '../models/color-mixer.types';

export const toInt255 = (v: number) => Math.round(v * 255);
const toColorHex = (v: number) => toInt255(v).toString(16).padStart(2, '0');

export const rgbToHex = (r: number, g: number, b: number) =>
  `#${toColorHex(r)}${toColorHex(g)}${toColorHex(b)}`.toUpperCase();

export function sliderGradient(
  channel: ColorChannel,
  r: number,
  g: number,
  b: number,
): Record<string, string> {
  const ri = toInt255(r);
  const gi = toInt255(g);
  const bi = toInt255(b);
  const gradients: Record<ColorChannel, Record<string, string>> = {
    r: {
      '--from-color': `rgb(0,${gi},${bi})`,
      '--to-color': `rgb(255,${gi},${bi})`,
    },
    g: {
      '--from-color': `rgb(${ri},0,${bi})`,
      '--to-color': `rgb(${ri},255,${bi})`,
    },
    b: {
      '--from-color': `rgb(${ri},${gi},0)`,
      '--to-color': `rgb(${ri},${gi},255)`,
    },
  };
  return gradients[channel];
}
