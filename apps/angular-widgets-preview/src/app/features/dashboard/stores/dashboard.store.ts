import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { FlutterBootstrapService } from '@core/services/flutter-bootstrap.service';
import {
  COLOR_MIXER_ENTRY_POINT_URL,
  ColorChannel,
  ColorMixerInitialData,
} from '@color-mixer';
import { TAP_BURST_ENTRY_POINT_URL, TapBurstInitialData } from '@tap-burst';

export type EntryPointState = 'idle' | 'loading' | 'ready' | 'error';

export interface TapBurstCardData {
  readonly type: 'tap-burst';
  readonly id: string;
  readonly initialData: TapBurstInitialData;
}

export interface ColorMixerCardData {
  readonly type: 'color-mixer';
  readonly id: string;
  readonly initialData: ColorMixerInitialData;
}

export type DashboardCard = TapBurstCardData | ColorMixerCardData;

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    cards: [] as DashboardCard[],
    addingCardIds: [] as string[],
    tbParticleCount: 10,
    tbBurstDuration: 800,
    cmR: 0.5,
    cmG: 0.5,
    cmB: 0.5,
  }),
  withComputed((store) => {
    const bootstrap = inject(FlutterBootstrapService);
    const tbApp = bootstrap.appStateSignal(
      TAP_BURST_ENTRY_POINT_URL,
      TAP_BURST_ENTRY_POINT_URL,
    );
    const cmApp = bootstrap.appStateSignal(
      COLOR_MIXER_ENTRY_POINT_URL,
      COLOR_MIXER_ENTRY_POINT_URL,
    );

    return {
      bootstrapStatus: bootstrap.bootstrapStatus,
      isAdding: computed(() => store.addingCardIds().length > 0),
      tapBurstEpState: computed((): EntryPointState => {
        const s = tbApp().state;
        if (s !== 'idle') return s;
        const addingIds = store.addingCardIds();
        if (
          addingIds.some(
            (id) =>
              store.cards().find((c) => c.id === id)?.type === 'tap-burst',
          )
        )
          return 'loading';
        return 'idle';
      }),
      colorMixerEpState: computed((): EntryPointState => {
        const s = cmApp().state;
        if (s !== 'idle') return s;
        const addingIds = store.addingCardIds();
        if (
          addingIds.some(
            (id) =>
              store.cards().find((c) => c.id === id)?.type === 'color-mixer',
          )
        )
          return 'loading';
        return 'idle';
      }),
    };
  }),
  withMethods((store) => ({
    addTapBurst(): void {
      const card: TapBurstCardData = {
        type: 'tap-burst',
        id: crypto.randomUUID(),
        initialData: {
          particleCount: store.tbParticleCount(),
          burstDurationMs: store.tbBurstDuration(),
        },
      };
      patchState(store, {
        cards: [...store.cards(), card],
        addingCardIds: [...store.addingCardIds(), card.id],
      });
    },
    addColorMixer(): void {
      const card: ColorMixerCardData = {
        type: 'color-mixer',
        id: crypto.randomUUID(),
        initialData: { r: store.cmR(), g: store.cmG(), b: store.cmB() },
      };
      patchState(store, {
        cards: [...store.cards(), card],
        addingCardIds: [...store.addingCardIds(), card.id],
      });
    },
    removeCard(id: string): void {
      patchState(store, {
        cards: store.cards().filter((c) => c.id !== id),
        addingCardIds: store.addingCardIds().filter((aid) => aid !== id),
      });
    },
    onCardReady(id: string): void {
      if (store.addingCardIds().includes(id)) {
        patchState(store, {
          addingCardIds: store.addingCardIds().filter((aid) => aid !== id),
        });
      }
    },
    onCardError(id: string): void {
      if (store.addingCardIds().includes(id)) {
        patchState(store, {
          addingCardIds: store.addingCardIds().filter((aid) => aid !== id),
        });
      }
    },
    setTbParticleCount(value: number): void {
      patchState(store, { tbParticleCount: Math.max(1, Math.min(200, value)) });
    },
    setTbBurstDuration(value: number): void {
      patchState(store, {
        tbBurstDuration: Math.max(100, Math.min(5000, value)),
      });
    },
    setCmChannel(ch: ColorChannel, value: number): void {
      const v = Math.max(0, Math.min(1, value));
      switch (ch) {
        case 'r':
          patchState(store, { cmR: v });
          break;
        case 'g':
          patchState(store, { cmG: v });
          break;
        case 'b':
          patchState(store, { cmB: v });
          break;
      }
    },
  })),
);

export type DashboardStore = InstanceType<typeof DashboardStore>;
