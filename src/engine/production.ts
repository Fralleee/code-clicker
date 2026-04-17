import { GAME_CONFIG } from "../config/gameConfig";
import { BUILDINGS } from "../data/buildings";
import {
  ACHIEVEMENT_BY_ID,
  CLICK_POWER_UPGRADES,
  CPS_CLICK_UPGRADES,
  GLOBAL_PRODUCTION_UPGRADES,
} from "../data/lookups";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import type { GameState } from "../types/game";
import { computeBuildingMultiplier } from "./multipliers";
import { computeNetTdPerSecond, computeTdPenalty } from "./techDebt";

export { computeBuildingMultiplier } from "./multipliers";

export interface ProductionResult {
  locPerSec: number;
  rawLocPerSec: number;
  techDebtPerSec: number;
  clickValue: number;
  tdMultiplier: number;
  surgeMultiplier: number;
  isRefactoring: boolean;
  buildingProductions: Map<string, number>;
}

/**
 * Compute all production values in a single pass.
 * Shared multipliers are computed once and reused across all buildings.
 */
// Memoize purchasedSet by array reference (avoids new Set() every tick)
let _purchasedCache: { arr: string[]; set: Set<string> } | null = null;

function getPurchasedSet(purchasedUpgrades: string[]): Set<string> {
  if (_purchasedCache && _purchasedCache.arr === purchasedUpgrades) return _purchasedCache.set;
  const set = new Set(purchasedUpgrades);
  _purchasedCache = { arr: purchasedUpgrades, set };
  return set;
}

export function computeAllProduction(state: GameState): ProductionResult {
  const now = Date.now();
  const purchasedSet = getPurchasedSet(state.purchasedUpgrades);
  const shared = computeSharedMultiplierProduct(state, purchasedSet, now);

  // Build owned-count + per-building multiplier lookups once
  const ownedCounts = new Map<string, number>();
  const buildingMults = new Map<string, number>();
  for (const b of state.buildings) {
    if (b.count > 0) {
      ownedCounts.set(b.id, b.count);
      buildingMults.set(b.id, computeBuildingMultiplier(b.id, purchasedSet));
    }
  }

  // Raw LoC/s (without TD penalty) — needed for TD penalty formula
  let rawLocPerSec = 0;
  for (const def of BUILDINGS) {
    const count = ownedCounts.get(def.id);
    if (!count) continue;
    rawLocPerSec += count * def.baseProduction * (buildingMults.get(def.id) ?? 1) * shared;
  }

  // TD multiplier (depends on raw production)
  const td = state.resources.techDebt ?? 0;
  const tdMultiplier = computeTdPenalty(td, rawLocPerSec);

  // Per-building production (with TD penalty + mastery mirroring)
  const buildingProductions = new Map<string, number>();
  let highest = 0;

  // First pass: compute base production for all buildings, find highest
  for (const def of BUILDINGS) {
    const count = ownedCounts.get(def.id);
    if (!count) continue;
    const base = count * def.baseProduction * (buildingMults.get(def.id) ?? 1) * shared * tdMultiplier;
    buildingProductions.set(def.id, base);
    if (base > highest) highest = base;
  }

  // Second pass: apply mastery mirroring
  let locPerSec = 0;
  for (const def of BUILDINGS) {
    const base = buildingProductions.get(def.id) ?? 0;
    if (base === 0) continue;
    if (isMastered(def.id, ownedCounts.get(def.id) ?? 0, purchasedSet)) {
      buildingProductions.set(def.id, highest);
      locPerSec += highest;
    } else {
      locPerSec += base;
    }
  }

  // Apply surge multiplier if active
  let surgeMultiplier = 1;
  if (state.surgeStartedAt) {
    const surgeElapsed = Math.max(0, (now - state.surgeStartedAt) / 1000);
    surgeMultiplier = GAME_CONFIG.surge.startMultiplier + Math.floor(surgeElapsed / GAME_CONFIG.surge.intervalSec);
    locPerSec *= surgeMultiplier;
    for (const [id, prod] of buildingProductions) {
      buildingProductions.set(id, prod * surgeMultiplier);
    }
  }

  // Compute click value from unpaused locPerSec (CPS bonus stays during refactoring)
  const clickValue = computeClickValue(state, purchasedSet, locPerSec, now);

  const isRefactoring = (state.refactoringUntil ?? 0) > now;
  if (isRefactoring) locPerSec = 0;

  // Tech debt per second
  const isFrozen = state.activeBuffs.some((b) => b.expiresAt > now && b.tdFreeze);
  const techDebtPerSec = isFrozen ? 0 : computeNetTdPerSecond(state, purchasedSet);

  return {
    locPerSec,
    rawLocPerSec,
    techDebtPerSec,
    clickValue,
    tdMultiplier,
    surgeMultiplier,
    isRefactoring,
    buildingProductions,
  };
}

// === Internal helpers ===

function computeSharedMultiplierProduct(state: GameState, purchasedSet: Set<string>, now: number): number {
  let global = 1;
  for (const up of GLOBAL_PRODUCTION_UPGRADES) {
    if (purchasedSet.has(up.id)) global *= up.multiplier;
  }

  const prestige = 1 + state.prestige.totalReputationEarned * GAME_CONFIG.prestige.reputationBonusRate;
  const angel = 1.1 ** state.prestige.prestigeUpgrades.filter((id) => id === "angel_investor").length;

  let achievement = 1;
  for (const achId of state.unlockedAchievements) {
    const ach = ACHIEVEMENT_BY_ID.get(achId);
    if (ach?.reward?.kind === "production_bonus") achievement *= ach.reward.multiplier;
  }

  let buff = 1;
  for (const b of state.activeBuffs) {
    if (b.expiresAt > now && b.productionMultiplier) buff *= b.productionMultiplier;
  }

  let prestigeProd = 1;
  if (state.prestige.prestigeUpgrades.includes("scaling_expert")) prestigeProd *= 1.25;
  if (state.prestige.prestigeUpgrades.includes("double_down")) prestigeProd *= 1.5;
  if (state.prestige.prestigeUpgrades.includes("exponential_growth")) prestigeProd *= 3;

  return global * prestige * angel * achievement * buff * prestigeProd;
}

function isMastered(buildingId: string, ownedCount: number, purchasedSet: Set<string>): boolean {
  if (ownedCount < GAME_CONFIG.buildings.masteryCount) return false;
  for (const upgradeId of getStandardUpgradeIds(buildingId)) {
    if (!purchasedSet.has(upgradeId)) return false;
  }
  return true;
}

function computeClickValue(state: GameState, purchasedSet: Set<string>, locPerSec: number, now: number): number {
  let clickMult = 1;
  for (const up of CLICK_POWER_UPGRADES) {
    if (purchasedSet.has(up.id)) clickMult *= up.multiplier;
  }

  let cpsPercent = 0;
  for (const up of CPS_CLICK_UPGRADES) {
    if (purchasedSet.has(up.id)) cpsPercent += up.percent;
  }

  const prestige = 1 + state.prestige.totalReputationEarned * GAME_CONFIG.prestige.reputationBonusRate;

  let achBonus = 1;
  for (const achId of state.unlockedAchievements) {
    const ach = ACHIEVEMENT_BY_ID.get(achId);
    if (ach?.reward?.kind === "click_bonus") achBonus *= ach.reward.multiplier;
  }

  let buffMult = 1;
  for (const b of state.activeBuffs) {
    if (b.expiresAt > now && b.clickMultiplier) buffMult *= b.clickMultiplier;
  }

  let prestigeClick = 1;
  if (state.prestige.prestigeUpgrades.includes("click_mastery")) prestigeClick *= 2;
  if (state.prestige.prestigeUpgrades.includes("click_power_large")) prestigeClick *= 5;
  if (state.prestige.prestigeUpgrades.includes("transcendence")) prestigeClick *= 100;

  const rawValue = Math.floor(1 * clickMult * prestige * achBonus * prestigeClick) + locPerSec * cpsPercent;
  return Math.floor(rawValue * buffMult);
}
