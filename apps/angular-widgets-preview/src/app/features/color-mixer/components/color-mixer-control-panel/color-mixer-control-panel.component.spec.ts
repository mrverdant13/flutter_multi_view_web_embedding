import { render, screen, fireEvent } from '@testing-library/angular';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ColorMixerControlPanelComponent } from './color-mixer-control-panel.component';

const PROVIDERS = [provideZonelessChangeDetection()];

describe('ColorMixerControlPanelComponent', () => {
  describe('config mode', () => {
    it('renders the "Initial values" label', async () => {
      await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 0.5, g: 0.5, b: 0.5 },
      });
      expect(screen.getByText('Initial values for new views')).toBeTruthy();
    });

    it('does not render the hex output display', async () => {
      await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 0, g: 0, b: 0 },
      });
      // In config mode the hex appears only inside the swatch, not the output-display
      expect(
        screen.queryByText('#000000', { selector: '.output-display *' }),
      ).toBeNull();
    });

    it('displays hex color in the swatch area', async () => {
      await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 1, g: 0, b: 0 },
      });
      expect(screen.getByText('#FF0000')).toBeTruthy();
    });

    it('displays integer channel values next to each slider', async () => {
      await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 1, g: 0.5, b: 0 },
      });
      const values = screen.getAllByText(/^\d+$/);
      const texts = values.map((el) => el.textContent?.trim());
      expect(texts).toContain('255'); // r=1 → 255
      expect(texts).toContain('128'); // g≈0.5 → 128
      expect(texts).toContain('0'); // b=0 → 0
    });
  });

  describe('control mode', () => {
    it('renders the hex output display', async () => {
      await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'control', r: 0, g: 0, b: 1 },
      });
      expect(screen.getByText('#0000FF')).toBeTruthy();
    });

    it('does not render the "Initial values" label', async () => {
      await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'control', r: 0.5, g: 0.5, b: 0.5 },
      });
      expect(screen.queryByText('Initial values for new views')).toBeNull();
    });
  });

  describe('NaN guard in onSliderInput', () => {
    it('does not emit when the slider value is not a number', async () => {
      const { fixture } = await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 0, g: 0, b: 0 },
      });
      const spy = vi.fn();
      fixture.componentInstance.rChange.subscribe(spy);

      fixture.componentInstance.onSliderInput(
        { target: { value: 'abc' } } as unknown as Event,
        'r',
      );

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('slider interactions', () => {
    it('emits rChange when the R slider changes', async () => {
      const { fixture } = await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 0, g: 0, b: 0 },
      });
      const spy = vi.fn();
      fixture.componentInstance.rChange.subscribe(spy);

      const [rSlider] = screen.getAllByRole('slider');
      fireEvent.input(rSlider, { target: { value: '0.8' } });

      expect(spy).toHaveBeenCalledWith(0.8);
    });

    it('emits gChange when the G slider changes', async () => {
      const { fixture } = await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 0, g: 0, b: 0 },
      });
      const spy = vi.fn();
      fixture.componentInstance.gChange.subscribe(spy);

      const sliders = screen.getAllByRole('slider');
      fireEvent.input(sliders[1], { target: { value: '0.5' } });

      expect(spy).toHaveBeenCalledWith(0.5);
    });

    it('emits bChange when the B slider changes', async () => {
      const { fixture } = await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 0, g: 0, b: 0 },
      });
      const spy = vi.fn();
      fixture.componentInstance.bChange.subscribe(spy);

      const sliders = screen.getAllByRole('slider');
      fireEvent.input(sliders[2], { target: { value: '0.25' } });

      expect(spy).toHaveBeenCalledWith(0.25);
    });

    it('sets CSS gradient custom properties on the host element', async () => {
      const { fixture } = await render(ColorMixerControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: { type: 'config', r: 1, g: 0, b: 0 },
      });
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.style.getPropertyValue('--r-from')).toBeTruthy();
      expect(host.style.getPropertyValue('--r-to')).toBeTruthy();
    });
  });
});
