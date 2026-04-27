export const TAP_BURST_ENTRY_POINT_URL =
  '/flutter-packages/tap-burst-web-component/';

export interface TapBurstInitialData {
  readonly particleCount: number;
  readonly burstDurationMs: number;
}

export const PARTICLE_COUNT_MIN = 1;
export const PARTICLE_COUNT_MAX = 200;
export const BURST_DURATION_MIN = 100;
export const BURST_DURATION_MAX = 5000;

export interface TapBurstApi {
  /** Particle count per burst (1–200). */
  particleCount: number;
  /** Burst animation duration in ms (100–5000). */
  burstDuration: number;
  /** Assigned to register; invoked when particle count changes inside Flutter. */
  onParticleCountChanged: ((n: number) => void) | null;
  /** Assigned to register; invoked when burst duration changes inside Flutter. */
  onBurstDurationChanged: ((ms: number) => void) | null;
}
