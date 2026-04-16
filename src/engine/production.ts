import { GAME_CONFIG } from "../config/gameConfig";
import { BUILDINGS } from "../data/buildings";
import {
  ACHIEVEMENT_BY_ID,
  BUILDING_BOOST_UPGRADES,
  CLICK_POWER_UPGRADES,
  CPS_CLICK_UPGRADES,
  GLOBAL_PRODUCTION_UPGRADES,
} from "../data/lookups";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import type { GameState } from "../types/game";
import { computeNetTdPerSecond, computeTdPenalty } from "./techDebt";

export interface ProductionResult {
  locPerSec: number;
  rawLocPerSec: number;
  techDebtPerSec: number;
  clickValue: number;
  tdMultiplier: number;
  buildingProductions: Map<string, number>;
}

/**
 * Compute all production values in a single pass.
 * Shared multipliers are computed once and reused across all buildings.
 */
export function computeAllProduction(state: GameState): ProductionResult {
  const purchasedSet = new Set(state.purchasedUpgrades);
  const shared = computeSharedMultiplierProduct(state, purchasedSet);

  // Raw LoC/s (without TD penalty) — needed for TD penalty formula
  let rawLocPerSec = 0;
  for (const def of BUILDINGS) {
    const owned = state.buildings.find((b) => b.id === def.id);
    if (!owned || owned.count === 0) continue;
    rawLocPerSec += owned.count * def.baseProduction * computeBuildingMultiplier(def.id, purchasedSet) * shared;
  }

  // TD multiplier (depends on raw production)
  const td = state.resources.techDebt ?? 0;
  const tdMultiplier = computeTdPenalty(td, rawLocPerSec);

  // Per-building production (with TD penalty + mastery mirroring)
  const buildingProductions = new Map<string, number>();
  let highest = 0;

  // First pass: compute base production for all buildings, find highest
  for (const def of BUILDINGS) {
    const owned = state.buildings.find((b) => b.id === def.id);
    if (!owned || owned.count === 0) continue;
    const base =
      owned.count * def.baseProduction * computeBuildingMultiplier(def.id, purchasedSet) * shared * tdMultiplier;
    buildingProductions.set(def.id, base);
    if (base > highest) highest = base;
  }

  // Second pass: apply mastery mirroring
  let locPerSec = 0;
  for (const def of BUILDINGS) {
    const base = buildingProductions.get(def.id) ?? 0;
    if (base === 0) continue;
    if (isMastered(state, def.id, purchasedSet)) {
      buildingProductions.set(def.id, highest);
      locPerSec += highest;
    } else {
      locPerSec += base;
    }
  }

  // Check if refactoring (paused production)
  const isRefactoring = (state.refactoringUntil ?? 0) > Date.now();
  if (isRefactoring) locPerSec = 0;

  // Tech debt per second
  const isFrozen = state.activeBuffs.some((b) => b.expiresAt > Date.now() && b.tdFreeze);
  const techDebtPerSec = isFrozen ? 0 : computeNetTdPerSecond(state, purchasedSet);

  // Click value
  const clickValue = computeClickValue(state, purchasedSet, locPerSec);

  return { locPerSec, rawLocPerSec, techDebtPerSec, clickValue, tdMultiplier, buildingProductions };
}

// === Multiplier helpers ===

export function computeBuildingMultiplier(buildingId: string, purchasedSet: Set<string>): number {
  let multiplier = 1;
  for (const boost of BUILDING_BOOST_UPGRADES.get(buildingId) ?? []) {
    if (purchasedSet.has(boost.id)) {
      multiplier *= boost.multiplier;
    }
  }
  return multiplier;
}

function computeSharedMultiplierProduct(state: GameState, purchasedSet: Set<string>): number {
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

  const now = Date.now();
  let buff = 1;
  for (const b of state.activeBuffs) {
    if (b.expiresAt > now && b.productionMultiplier) buff *= b.productionMultiplier;
  }

  let prestigeProd = 1;
  if (state.prestige.prestigeUpgrades.includes("scaling_expert")) prestigeProd *= 1.25;
  if (state.prestige.prestigeUpgrades.includes("double_down")) prestigeProd *= 1.5;

  return global * prestige * angel * achievement * buff * prestigeProd;
}

function isMastered(state: GameState, buildingId: string, purchasedSet: Set<string>): boolean {
  const owned = state.buildings.find((b) => b.id === buildingId);
  if (!owned || owned.count < GAME_CONFIG.buildings.masteryCount) return false;
  for (const upgradeId of getStandardUpgradeIds(buildingId)) {
    if (!purchasedSet.has(upgradeId)) return false;
  }
  return true;
}

function computeClickValue(state: GameState, purchasedSet: Set<string>, locPerSec: number): number {
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

  const now = Date.now();
  let buffMult = 1;
  for (const b of state.activeBuffs) {
    if (b.expiresAt > now && b.clickMultiplier) buffMult *= b.clickMultiplier;
  }

  let prestigeClick = 1;
  if (state.prestige.prestigeUpgrades.includes("click_mastery")) prestigeClick *= 2;
  if (state.prestige.prestigeUpgrades.includes("click_power_large")) prestigeClick *= 5;

  const rawValue = Math.floor(1 * clickMult * prestige * achBonus * prestigeClick) + locPerSec * cpsPercent;
  return Math.floor(rawValue * buffMult);
}
