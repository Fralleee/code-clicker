import { GAME_CONFIG } from "../config/gameConfig";

export type BugSeverity = "minor" | "major" | "critical";

export interface BugDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  severity: BugSeverity;
  lifetimeMs: number;
  /** Seconds of production lost if bug expires unfixed */
  missPenaltySeconds: number;
  /** Seconds of production gained when fixed */
  fixRewardSeconds: number;
  /** Percentage of current TD removed when fixed (0.01 = 1%) */
  fixTdReductionPercent: number;
  /** Special effect while bug is alive (major only) */
  aliveEffect?: "production_drain" | "building_pause";
  /** Special effect when bug expires unfixed (critical only) */
  missEffect?: "production_freeze" | "td_double" | "extra_penalty";
}

export const BUG_TYPES: BugDefinition[] = [
  // Minor - cosmetic variety, small stakes
  {
    id: "typo",
    name: "Typo in Variable",
    icon: "🐛",
    description: "camelCase? More like came1Case.",
    severity: "minor",
    lifetimeMs: 10_000,
    missPenaltySeconds: 5,
    fixRewardSeconds: 5,
    fixTdReductionPercent: 0.01,
  },
  {
    id: "missing_semicolon",
    name: "Missing Semicolon",
    icon: "🔤",
    description: "JavaScript doesn't care, but your linter does.",
    severity: "minor",
    lifetimeMs: 10_000,
    missPenaltySeconds: 5,
    fixRewardSeconds: 5,
    fixTdReductionPercent: 0.01,
  },

  // Major - real consequences, unique alive effects
  {
    id: "memory_leak",
    name: "Memory Leak",
    icon: "💧",
    description: "The heap is crying. Production drains while alive.",
    severity: "major",
    lifetimeMs: 8_000,
    missPenaltySeconds: 15,
    fixRewardSeconds: 10,
    fixTdReductionPercent: 0.03,
    aliveEffect: "production_drain",
  },
  {
    id: "infinite_loop",
    name: "Infinite Loop",
    icon: "🔄",
    description: "while(true) { bugs++; } One building paused.",
    severity: "major",
    lifetimeMs: 8_000,
    missPenaltySeconds: 15,
    fixRewardSeconds: 10,
    fixTdReductionPercent: 0.03,
    aliveEffect: "building_pause",
  },
  {
    id: "race_condition",
    name: "Race Condition",
    icon: "🏎️",
    description: "Two threads walk into a bar...",
    severity: "major",
    lifetimeMs: 8_000,
    missPenaltySeconds: 15,
    fixRewardSeconds: 10,
    fixTdReductionPercent: 0.03,
  },

  // Critical - urgent, devastating if missed
  {
    id: "segfault",
    name: "Segfault",
    icon: "💀",
    description: "Core dumped. Fix NOW or production halts.",
    severity: "critical",
    lifetimeMs: 6_000,
    missPenaltySeconds: 30,
    fixRewardSeconds: 20,
    fixTdReductionPercent: 0.05,
    missEffect: "production_freeze",
  },
  {
    id: "production_outage",
    name: "Production Outage",
    icon: "🔥",
    description: "Everything is on fire. TD doubles if unfixed.",
    severity: "critical",
    lifetimeMs: 6_000,
    missPenaltySeconds: 30,
    fixRewardSeconds: 20,
    fixTdReductionPercent: 0.05,
    missEffect: "td_double",
  },
  {
    id: "security_vuln",
    name: "Security Vulnerability",
    icon: "⚠️",
    description: "CVE-2024-OHNO. Massive losses if unfixed.",
    severity: "critical",
    lifetimeMs: 6_000,
    missPenaltySeconds: 60,
    fixRewardSeconds: 20,
    fixTdReductionPercent: 0.05,
    missEffect: "extra_penalty",
  },
];

const MINOR_BUGS = BUG_TYPES.filter((b) => b.severity === "minor");
const MAJOR_BUGS = BUG_TYPES.filter((b) => b.severity === "major");
const CRITICAL_BUGS = BUG_TYPES.filter((b) => b.severity === "critical");

export function pickRandomBug(rawLocPerSec: number, techDebt: number): BugDefinition {
  const tdRatio = rawLocPerSec > 0 ? techDebt / rawLocPerSec : 0;

  // Weight severity based on TD relative to production
  let pool: BugDefinition[];
  const { minorOnlyThreshold, majorThreshold } = GAME_CONFIG.bugs;
  if (tdRatio < minorOnlyThreshold) {
    pool = MINOR_BUGS;
  } else if (tdRatio < majorThreshold) {
    pool = [...MINOR_BUGS, ...MINOR_BUGS, ...MAJOR_BUGS];
  } else {
    // High: all severities, criticals more likely
    pool = [...MINOR_BUGS, ...MAJOR_BUGS, ...MAJOR_BUGS, ...CRITICAL_BUGS, ...CRITICAL_BUGS];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getMaxActiveBugs(rawLocPerSec: number, techDebt: number): number {
  if (rawLocPerSec <= 0) return 1;
  const tdRatio = techDebt / rawLocPerSec;
  if (tdRatio < GAME_CONFIG.bugs.minorOnlyThreshold) return 1;
  if (tdRatio < GAME_CONFIG.bugs.majorThreshold) return 2;
  return 3;
}

export function getBugSpawnInterval(rawLocPerSec: number, techDebt: number): { min: number; max: number } {
  if (techDebt < 100 && rawLocPerSec < 1) return { min: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };

  const tdRatio = rawLocPerSec > 0 ? techDebt / rawLocPerSec : 0;

  const {
    noSpawnThreshold,
    spawnScaleDivisor,
    baseMinIntervalMs,
    baseMaxIntervalMs,
    minIntervalFloorMs,
    maxIntervalFloorMs,
  } = GAME_CONFIG.bugs;
  if (tdRatio < noSpawnThreshold) return { min: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };

  const scale = Math.min(tdRatio / spawnScaleDivisor, 1);
  return {
    min: Math.max(minIntervalFloorMs, baseMinIntervalMs * (1 - scale)),
    max: Math.max(maxIntervalFloorMs, baseMaxIntervalMs * (1 - scale)),
  };
}
