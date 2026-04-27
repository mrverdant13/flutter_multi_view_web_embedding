import { describe, expect, it } from 'vitest';
import { rgbToHex, sliderGradient, toInt255 } from './color-utils';

describe('toInt255', () => {
  it('maps 0 to 0', () => {
    expect(toInt255(0)).toBe(0);
  });

  it('maps 1 to 255', () => {
    expect(toInt255(1)).toBe(255);
  });

  it('maps 0.5 to 128', () => {
    expect(toInt255(0.5)).toBe(128);
  });

  it('rounds fractional results', () => {
    expect(toInt255(1 / 3)).toBe(85);
  });
});

describe('rgbToHex', () => {
  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(1, 1, 1)).toBe('#FFFFFF');
  });

  it('converts pure red', () => {
    expect(rgbToHex(1, 0, 0)).toBe('#FF0000');
  });

  it('converts pure green', () => {
    expect(rgbToHex(0, 1, 0)).toBe('#00FF00');
  });

  it('converts pure blue', () => {
    expect(rgbToHex(0, 0, 1)).toBe('#0000FF');
  });

  it('pads single hex digits', () => {
    expect(rgbToHex(0, 1 / 255, 0)).toBe('#000100');
  });

  it('returns uppercase hex', () => {
    const result = rgbToHex(0.6, 0.7, 0.8);
    expect(result).toBe(result.toUpperCase());
  });
});

describe('sliderGradient', () => {
  it('red channel: from-color has r=0, to-color has r=255', () => {
    const style = sliderGradient('r', 1, 0.5, 0.25);
    const gi = Math.round(0.5 * 255);
    const bi = Math.round(0.25 * 255);
    expect(style['--from-color']).toBe(`rgb(0,${gi},${bi})`);
    expect(style['--to-color']).toBe(`rgb(255,${gi},${bi})`);
  });

  it('green channel: from-color has g=0, to-color has g=255', () => {
    const style = sliderGradient('g', 0.5, 1, 0.25);
    const ri = Math.round(0.5 * 255);
    const bi = Math.round(0.25 * 255);
    expect(style['--from-color']).toBe(`rgb(${ri},0,${bi})`);
    expect(style['--to-color']).toBe(`rgb(${ri},255,${bi})`);
  });

  it('blue channel: from-color has b=0, to-color has b=255', () => {
    const style = sliderGradient('b', 0.5, 0.25, 1);
    const ri = Math.round(0.5 * 255);
    const gi = Math.round(0.25 * 255);
    expect(style['--from-color']).toBe(`rgb(${ri},${gi},0)`);
    expect(style['--to-color']).toBe(`rgb(${ri},${gi},255)`);
  });

  it('other channels are fixed at current values', () => {
    const style = sliderGradient('r', 0, 0, 0);
    expect(style['--from-color']).toBe('rgb(0,0,0)');
    expect(style['--to-color']).toBe('rgb(255,0,0)');
  });
});
