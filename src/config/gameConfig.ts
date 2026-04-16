export const GAME_CONFIG = {
  buildings: {
    maxCount: 500,
    masteryCount: 500,
  },
  techDebt: {
    penaltyAmplitude: 0.75,
    minMultiplier: 0.25,
    divisorMin: 1000,
    divisorScale: 15,
    refactorDurationMs: 10_000,
    refactorRetainRate: 0.3,
    cleanStartDurationSec: 60,
    cleanStartMultiplier: 0.5,
    peakBonusThreshold: 10_000,
    peakBonusMaxRate: 0.1,
  },
  bugs: {
    noSpawnThreshold: 1,
    minorOnlyThreshold: 2,
    majorThreshold: 10,
    spawnScaleDivisor: 15,
    baseMinIntervalMs: 60_000,
    baseMaxIntervalMs: 90_000,
    minIntervalFloorMs: 5_000,
    maxIntervalFloorMs: 10_000,
  },
  buffs: {
    spawnDurationMs: 10_000,
    minSpawnIntervalMs: 45_000,
    maxSpawnIntervalMs: 120_000,
  },
  prestige: {
    baseThreshold: 1_000_000,
    reducedThreshold: 500_000,
    reputationBonusRate: 0.01,
  },
  tick: {
    intervalMs: 50,
  },
  offline: {
    maxSeconds: 8 * 60 * 60,
  },
  autosave: {
    intervalMs: 30_000,
  },
} as const;
