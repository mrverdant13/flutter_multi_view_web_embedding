import { render, screen, fireEvent } from '@testing-library/angular';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { TapBurstControlPanelComponent } from './tap-burst-control-panel.component';
import {
  BURST_DURATION_MAX,
  BURST_DURATION_MIN,
  PARTICLE_COUNT_MAX,
  PARTICLE_COUNT_MIN,
} from '../../models/tap-burst.types';

const PROVIDERS = [provideZonelessChangeDetection()];

describe('TapBurstControlPanelComponent', () => {
  describe('config mode', () => {
    it('renders the "Initial values" label', async () => {
      await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      expect(screen.getByText('Initial values for new views')).toBeTruthy();
    });

    it('does not render the output display', async () => {
      await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      expect(screen.queryByText(/particles/)).toBeNull();
    });

    it('particle count input has correct min, max, and value', async () => {
      await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 50,
          burstDuration: 800,
        },
      });
      const input = screen.getByLabelText('Particles') as HTMLInputElement;
      expect(input.min).toBe(String(PARTICLE_COUNT_MIN));
      expect(input.max).toBe(String(PARTICLE_COUNT_MAX));
      expect(input.value).toBe('50');
    });

    it('burst duration input has correct min, max, and value', async () => {
      await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 1200,
        },
      });
      const input = screen.getByLabelText('Duration (ms)') as HTMLInputElement;
      expect(input.min).toBe(String(BURST_DURATION_MIN));
      expect(input.max).toBe(String(BURST_DURATION_MAX));
      expect(input.value).toBe('1200');
    });

    it('emits particleCountChange when the particle input changes', async () => {
      const { fixture } = await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      const spy = vi.fn();
      fixture.componentInstance.particleCountChange.subscribe(spy);

      fireEvent.input(screen.getByLabelText('Particles'), {
        target: { value: '75' },
      });

      expect(spy).toHaveBeenCalledWith(75);
    });

    it('emits burstDurationChange when the duration input changes', async () => {
      const { fixture } = await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      const spy = vi.fn();
      fixture.componentInstance.burstDurationChange.subscribe(spy);

      fireEvent.input(screen.getByLabelText('Duration (ms)'), {
        target: { value: '2000' },
      });

      expect(spy).toHaveBeenCalledWith(2000);
    });

    it('does not emit when the input value is not a number', async () => {
      const { fixture } = await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      const spy = vi.fn();
      fixture.componentInstance.particleCountChange.subscribe(spy);

      fireEvent.input(screen.getByLabelText('Particles'), {
        target: { value: '' },
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('null-target guard', () => {
    it('does not crash when event has no target', async () => {
      const { fixture } = await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      const spy = vi.fn();
      fixture.componentInstance.particleCountChange.subscribe(spy);
      fixture.componentInstance.onParticleCountInput(new Event('input'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not crash when burst-duration event has no target', async () => {
      const { fixture } = await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      const spy = vi.fn();
      fixture.componentInstance.burstDurationChange.subscribe(spy);
      fixture.componentInstance.onBurstDurationInput(new Event('input'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('NaN guard for burst duration', () => {
    it('does not emit burstDurationChange when the value is not a number', async () => {
      const { fixture } = await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'config',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      const spy = vi.fn();
      fixture.componentInstance.burstDurationChange.subscribe(spy);

      fireEvent.input(screen.getByLabelText('Duration (ms)'), {
        target: { value: '' },
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('control mode', () => {
    it('renders the output display with current values', async () => {
      await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'control',
          particleCount: 30,
          burstDuration: 1500,
        },
      });
      expect(screen.getByText('30 particles')).toBeTruthy();
      expect(screen.getByText('1500 ms')).toBeTruthy();
    });

    it('does not render the "Initial values" label', async () => {
      await render(TapBurstControlPanelComponent, {
        providers: PROVIDERS,
        componentInputs: {
          type: 'control',
          particleCount: 10,
          burstDuration: 800,
        },
      });
      expect(screen.queryByText('Initial values for new views')).toBeNull();
    });
  });
});
