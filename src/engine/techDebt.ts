import { GAME_CONFIG } from "../config/gameConfig";
import { getBugSpawnInterval, getMaxActiveBugs } from "../data/bugs";
import { BUILDINGS } from "../data/buildings";
import { TD_REDUCTION_UPGRADES } from "../data/lookups";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import type { GameState } from "../types/game";
import { computeBuildingMultiplier } from "./production";

export interface TechDebtStatus {
  current: number;
  netPerSecond: number;
  penaltyMultiplier: number;
  isFrozen: boolean;
  isRefactoring: boolean;
  canRefactor: boolean;
  bugSpawnInterval: { min: number; max: number };
  maxActiveBugs: number;
}

/**
 * Compute the TD penalty multiplier applied to production.
 * Returns 1.0 when no debt, asymptotically approaches GAME_CONFIG.techDebt.minMultiplier at high debt.
 */
export function computeTdPenalty(techDebt: number, rawLocPerSec: number): number {
  if (techDebt <= 0) return 1;
  const { divisorMin, divisorScale, penaltyAmplitude, minMultiplier } = GAME_CONFIG.techDebt;
  const divisor = Math.max(divisorMin, rawLocPerSec * divisorScale);
  const penalty = penaltyAmplitude * (1 - Math.exp(-techDebt / divisor));
  return Math.max(minMultiplier, 1 - penalty);
}

/**
 * Compute the net TD generation rate per second across all buildings.
 * Positive = debt accumulating, negative = debt being cleaned.
 */
export function computeNetTdPerSecond(state: GameState, purchasedSet: Set<string>): number {
  let total = 0;
  for (const def of BUILDINGS) {
    const owned = state.buildings.find((b) => b.id === def.id);
    if (!owned || owned.count === 0) continue;

    const buildingMult = computeBuildingMultiplier(def.id, purchasedSet);
    let tdRate = owned.count * def.baseProduction * def.techDebtRatio * buildingMult;

    if (tdRate > 0) {
      tdRate *= computeTdReduction(def.id, purchasedSet);
    } else if (tdRate < 0) {
      tdRate *= computeCleanerBonus(def.id, def.techDebtRatio, purchasedSet);
    }
    total += tdRate;
  }

  if (total > 0) {
    total *= computeCleanStartMultiplier(state);
  }
  return total;
}

/**
 * Compute full tech debt status for the current game state.
 */
export function computeTechDebtStatus(
  state: GameState,
  rawLocPerSec: number,
  purchasedSet: Set<string>,
): TechDebtStatus {
  const current = state.resources.techDebt ?? 0;
  const now = Date.now();
  const isFrozen = state.activeBuffs.some((b) => b.expiresAt > now && b.tdFreeze);
  const isRefactoring = (state.refactoringUntil ?? 0) > now;

  return {
    current,
    netPerSecond: isFrozen ? 0 : computeNetTdPerSecond(state, purchasedSet),
    penaltyMultiplier: computeTdPenalty(current, rawLocPerSec),
    isFrozen,
    isRefactoring,
    canRefactor: current > 0 && !isRefactoring,
    bugSpawnInterval: getBugSpawnInterval(rawLocPerSec, current),
    maxActiveBugs: getMaxActiveBugs(rawLocPerSec, current),
  };
}

// === Internal helpers ===

function computeTdReduction(buildingId: string, purchasedSet: Set<string>): number {
  let reduction = 1;
  for (const up of TD_REDUCTION_UPGRADES.get(buildingId) ?? []) {
    if (purchasedSet.has(up.id)) {
      reduction *= 1 - up.reduction;
    }
  }
  return reduction;
}

function computeCleanerBonus(buildingId: string, techDebtRatio: number, purchasedSet: Set<string>): number {
  if (techDebtRatio >= 0) return 1;
  const standardIds = getStandardUpgradeIds(buildingId);
  let boosts = 0;
  for (const id of standardIds) {
    if (purchasedSet.has(id)) boosts += 1;
  }
  return 1 + boosts * 0.1;
}

export function computeCleanStartMultiplier(state: GameState): number {
  if (!state.prestige.prestigeUpgrades.includes("clean_start")) return 1;
  const elapsed = state.stats.totalTimePlayed;
  if (elapsed < GAME_CONFIG.techDebt.cleanStartDurationSec) return GAME_CONFIG.techDebt.cleanStartMultiplier;
  return 1;
}
