import { GAME_CONFIG } from "../config/gameConfig";
import { BUILDINGS } from "../data/buildings";
import {
  ACHIEVEMENT_BY_ID,
  BUILDING_BOOST_UPGRADES,
  BUILDING_BY_ID,
  CLICK_POWER_UPGRADES,
  CPS_CLICK_UPGRADES,
  GLOBAL_PRODUCTION_UPGRADES,
} from "../data/lookups";
import { BASE_PRESTIGE_THRESHOLD, getPrestigeThreshold } from "../data/prestige";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import { UPGRADES } from "../data/upgrades";
import { computeNetTdPerSecond, computeTdPenalty } from "../engine/techDebt";
import type { GameState } from "../types/game";

// === Purchased Upgrades Set (O(1) lookups, memoized per state) ===

let _upgradeSetCache: { upgrades: string[]; set: Set<string> } | null = null;

export function getPurchasedSet(state: GameState): Set<string> {
  if (_upgradeSetCache && _upgradeSetCache.upgrades === state.purchasedUpgrades) {
    return _upgradeSetCache.set;
  }
  const set = new Set(state.purchasedUpgrades);
  _upgradeSetCache = { upgrades: state.purchasedUpgrades, set };
  return set;
}

// === Prestige Multipliers ===

export function selectPrestigeMultiplier(state: GameState): number {
  return 1 + state.prestige.totalReputationEarned * GAME_CONFIG.prestige.reputationBonusRate;
}

export function selectAngelInvestorBonus(state: GameState): number {
  const count = state.prestige.prestigeUpgrades.filter((id) => id === "angel_investor").length;
  return 1.1 ** count;
}

export function selectCostReduction(state: GameState): number {
  const reduction = state.prestige.prestigeUpgrades.includes("better_interviews") ? 0.95 : 1;
  return reduction;
}

export function selectPrestigeClickBonus(state: GameState): number {
  let mult = 1;
  if (state.prestige.prestigeUpgrades.includes("click_mastery")) mult *= 2;
  if (state.prestige.prestigeUpgrades.includes("click_power_large")) mult *= 5;
  if (state.prestige.prestigeUpgrades.includes("transcendence")) mult *= 100;
  return mult;
}

export function selectPrestigeProductionBonus(state: GameState): number {
  let mult = 1;
  if (state.prestige.prestigeUpgrades.includes("scaling_expert")) mult *= 1.25;
  if (state.prestige.prestigeUpgrades.includes("double_down")) mult *= 1.5;
  if (state.prestige.prestigeUpgrades.includes("exponential_growth")) mult *= 3;
  return mult;
}

export { computeCleanStartMultiplier as selectCleanStartMultiplier } from "../engine/techDebt";

// === Achievement Bonuses ===

export function selectAchievementProductionBonus(state: GameState): number {
  let multiplier = 1;
  for (const achId of state.unlockedAchievements) {
    const ach = ACHIEVEMENT_BY_ID.get(achId);
    if (ach?.reward?.kind === "production_bonus") {
      multiplier *= ach.reward.multiplier;
    }
  }
  return multiplier;
}

export function selectAchievementClickBonus(state: GameState): number {
  let multiplier = 1;
  for (const achId of state.unlockedAchievements) {
    const ach = ACHIEVEMENT_BY_ID.get(achId);
    if (ach?.reward?.kind === "click_bonus") {
      multiplier *= ach.reward.multiplier;
    }
  }
  return multiplier;
}

// === Upgrade Multipliers ===

export function selectBuildingMultiplier(state: GameState, buildingId: string): number {
  const purchased = getPurchasedSet(state);
  let multiplier = 1;
  for (const boost of BUILDING_BOOST_UPGRADES.get(buildingId) ?? []) {
    if (purchased.has(boost.id)) {
      multiplier *= boost.multiplier;
    }
  }
  return multiplier;
}

export function selectGlobalProductionMultiplier(state: GameState): number {
  const purchased = getPurchasedSet(state);
  let multiplier = 1;
  for (const up of GLOBAL_PRODUCTION_UPGRADES) {
    if (purchased.has(up.id)) {
      multiplier *= up.multiplier;
    }
  }
  return multiplier;
}

// === Active Buff Multipliers ===

export function selectActiveBuffProductionMultiplier(state: GameState): number {
  const now = Date.now();
  let multiplier = 1;
  for (const buff of state.activeBuffs) {
    if (buff.expiresAt > now && buff.productionMultiplier) {
      multiplier *= buff.productionMultiplier;
    }
  }
  return multiplier;
}

export function selectActiveBuffClickMultiplier(state: GameState): number {
  const now = Date.now();
  let multiplier = 1;
  for (const buff of state.activeBuffs) {
    if (buff.expiresAt > now && buff.clickMultiplier) {
      multiplier *= buff.clickMultiplier;
    }
  }
  return multiplier;
}

export function selectHasActiveBuff(state: GameState): boolean {
  const now = Date.now();
  return state.activeBuffs.some((b) => b.expiresAt > now);
}

export function selectIsTdFrozen(state: GameState): boolean {
  const now = Date.now();
  return state.activeBuffs.some((b) => b.expiresAt > now && b.tdFreeze);
}

export function selectIsBugImmune(state: GameState): boolean {
  const now = Date.now();
  return state.activeBuffs.some((b) => b.expiresAt > now && b.bugImmunity);
}

// === Shared Multipliers (computed once, reused across buildings) ===

interface SharedMultipliers {
  global: number;
  prestige: number;
  achievement: number;
  angel: number;
  buff: number;
  prestigeProd: number;
}

let _sharedCache: { state: GameState; product: number; tdMult: number } | null = null;

function getCachedSharedProduct(state: GameState): { shared: number; tdMult: number } {
  if (_sharedCache && _sharedCache.state === state) {
    return { shared: _sharedCache.product, tdMult: _sharedCache.tdMult };
  }
  const shared = sharedMultiplierProduct(computeSharedMultipliers(state));
  const tdMult = computeTechDebtMultiplier(state, shared);
  _sharedCache = { state, product: shared, tdMult };
  return { shared, tdMult };
}

function computeSharedMultipliers(state: GameState): SharedMultipliers {
  return {
    global: selectGlobalProductionMultiplier(state),
    prestige: selectPrestigeMultiplier(state),
    achievement: selectAchievementProductionBonus(state),
    angel: selectAngelInvestorBonus(state),
    buff: selectActiveBuffProductionMultiplier(state),
    prestigeProd: selectPrestigeProductionBonus(state),
  };
}

function sharedMultiplierProduct(m: SharedMultipliers): number {
  return m.global * m.prestige * m.achievement * m.angel * m.buff * m.prestigeProd;
}

// === Technical Debt ===

/** Raw LoC/s WITHOUT tech debt penalty (used to scale the TD penalty formula) */
export function selectRawLocPerSecond(state: GameState): number {
  const shared = sharedMultiplierProduct(computeSharedMultipliers(state));
  return rawLocPerSecondWithShared(state, shared);
}

function rawLocPerSecondWithShared(state: GameState, shared: number): number {
  let total = 0;
  for (const def of BUILDINGS) {
    const owned = state.buildings.find((b) => b.id === def.id);
    if (!owned || owned.count === 0) continue;
    total += owned.count * def.baseProduction * selectBuildingMultiplier(state, def.id) * shared;
  }
  return total;
}

export function selectTechDebtMultiplier(state: GameState): number {
  return getCachedSharedProduct(state).tdMult;
}

function computeTechDebtMultiplier(state: GameState, shared: number): number {
  const td = state.resources.techDebt ?? 0;
  if (td <= 0) return 1;
  const rawLocPerSec = rawLocPerSecondWithShared(state, shared);
  return computeTdPenalty(td, rawLocPerSec);
}

export function selectNetTechDebtPerSecond(state: GameState): number {
  return computeNetTdPerSecond(state, getPurchasedSet(state));
}

// === Building Production ===

/** Mastery: masteryCount + all standard tier upgrades purchased → mirrors highest building production */
export function selectBuildingMastery(state: GameState, buildingId: string): boolean {
  const owned = state.buildings.find((b) => b.id === buildingId);
  if (!owned || owned.count < GAME_CONFIG.buildings.masteryCount) return false;
  // Only check standard tier upgrades, not cross-building, early, or td_reduction upgrades.
  const purchased = getPurchasedSet(state);
  for (const upgradeId of getStandardUpgradeIds(buildingId)) {
    if (!purchased.has(upgradeId)) {
      return false;
    }
  }
  return true;
}

function selectBuildingProductionBeforeMastery(state: GameState, buildingId: string): number {
  const { shared, tdMult } = getCachedSharedProduct(state);
  return buildingProductionWithShared(state, buildingId, shared, tdMult);
}

/** Internal: production with pre-computed shared multipliers (avoids recomputing per building) */
function buildingProductionWithShared(state: GameState, buildingId: string, shared: number, tdMult: number): number {
  const def = BUILDING_BY_ID.get(buildingId);
  const owned = state.buildings.find((b) => b.id === buildingId);
  if (!def || !owned || owned.count === 0) return 0;

  return owned.count * def.baseProduction * selectBuildingMultiplier(state, buildingId) * shared * tdMult;
}

let _highestCache: { state: GameState; value: number } | null = null;

function selectHighestProductionBeforeMastery(state: GameState): number {
  if (_highestCache && _highestCache.state === state) return _highestCache.value;
  const { shared, tdMult } = getCachedSharedProduct(state);
  let max = 0;
  for (const def of BUILDINGS) {
    const prod = buildingProductionWithShared(state, def.id, shared, tdMult);
    if (prod > max) max = prod;
  }
  _highestCache = { state, value: max };
  return max;
}

export function selectBuildingProduction(state: GameState, buildingId: string): number {
  const base = selectBuildingProductionBeforeMastery(state, buildingId);
  if (base === 0) return 0;

  if (selectBuildingMastery(state, buildingId)) {
    return selectHighestProductionBeforeMastery(state);
  }

  return base;
}

export function selectLocPerSecond(state: GameState): number {
  const { shared, tdMult } = getCachedSharedProduct(state);
  let highest: number | null = null;
  let total = 0;
  for (const def of BUILDINGS) {
    const base = buildingProductionWithShared(state, def.id, shared, tdMult);
    if (base === 0) continue;
    if (selectBuildingMastery(state, def.id)) {
      highest ??= selectHighestProductionBeforeMastery(state);
      total += highest;
    } else {
      total += base;
    }
  }
  return total;
}

// === Click Value ===

export function selectClickPowerMultiplier(state: GameState): number {
  const purchased = getPurchasedSet(state);
  let multiplier = 1;
  for (const up of CLICK_POWER_UPGRADES) {
    if (purchased.has(up.id)) {
      multiplier *= up.multiplier;
    }
  }
  return multiplier;
}

export function selectCpsClickPercent(state: GameState): number {
  const purchased = getPurchasedSet(state);
  let percent = 0;
  for (const up of CPS_CLICK_UPGRADES) {
    if (purchased.has(up.id)) {
      percent += up.percent;
    }
  }
  return percent;
}

export function selectClickValue(state: GameState): number {
  const baseClick = 1;
  const clickMult = selectClickPowerMultiplier(state);
  const prestigeMult = selectPrestigeMultiplier(state);
  const achBonus = selectAchievementClickBonus(state);
  const buffMult = selectActiveBuffClickMultiplier(state);
  const locPerSec = selectLocPerSecond(state);
  const cpsPercent = selectCpsClickPercent(state);

  const prestigeClick = selectPrestigeClickBonus(state);

  // Click buff multiplier applies to the ENTIRE click value including CPS bonus
  const rawValue = Math.floor(baseClick * clickMult * prestigeMult * achBonus * prestigeClick) + locPerSec * cpsPercent;
  return Math.floor(rawValue * buffMult);
}

// === Prestige ===

export function selectCanPrestige(state: GameState): boolean {
  const threshold = getPrestigeThreshold(state.prestige.prestigeUpgrades);
  return state.resources.totalLoCEarned >= threshold;
}

export function selectReputationOnPrestige(state: GameState): number {
  const hasBoost = state.prestige.prestigeUpgrades.includes("serial_entrepreneur");
  const base = Math.floor(Math.sqrt(state.resources.totalLoCEarned / BASE_PRESTIGE_THRESHOLD));
  let rep = hasBoost ? Math.floor(base * 1.5) : base;
  // Reputation Machine: double reputation
  if (state.prestige.prestigeUpgrades.includes("reputation_double")) {
    rep *= 2;
  }
  const peakTD = state.resources.peakTechDebt ?? 0;
  if (peakTD > 0) {
    const { peakBonusThreshold, peakBonusMaxRate } = GAME_CONFIG.techDebt;
    rep = Math.floor(rep * (1 + Math.min(peakTD / peakBonusThreshold, 1) * peakBonusMaxRate));
  }
  return rep;
}

// === Visibility ===

export type BuildingVisibility = "hidden" | "mystery" | "revealed";

export interface VisibleBuilding {
  building: (typeof BUILDINGS)[number];
  visibility: BuildingVisibility;
}

export function selectVisibleBuildings(state: GameState): VisibleBuilding[] {
  const result: VisibleBuilding[] = [];
  for (const b of BUILDINGS) {
    const owned = state.buildings.some((ob) => ob.id === b.id && ob.count > 0);
    const totalLoC = state.resources.totalLoCEarned;

    if (owned || totalLoC >= b.unlockThreshold) {
      result.push({ building: b, visibility: "revealed" });
    } else if (b.unlockThreshold === 0 || totalLoC >= b.unlockThreshold * 0.5) {
      // Show as mystery when you've earned 50%+ of the threshold
      result.push({ building: b, visibility: "mystery" });
    }
    // else: hidden, don't add
  }
  return result;
}

export function selectVisibleUpgrades(state: GameState) {
  const purchased = getPurchasedSet(state);
  return UPGRADES.filter((upgrade): boolean => {
    if (purchased.has(upgrade.id)) return false;
    const cond = upgrade.unlockCondition;
    switch (cond.kind) {
      case "total_loc":
        return state.resources.totalLoCEarned >= cond.amount;
      case "total_clicks":
        return state.resources.totalClicks >= cond.count;
      case "building_count": {
        const owned = state.buildings.find((b) => b.id === cond.buildingId);
        return (owned?.count ?? 0) >= cond.count;
      }
      case "prestige_level":
        return state.prestige.timesShipped >= cond.level;
      default:
        return false;
    }
  }).sort((a, b) => a.cost - b.cost);
}

export function selectTotalBuildings(state: GameState): number {
  return state.buildings.reduce((sum, b) => sum + b.count, 0);
}

// === Win Condition ===

export function selectMasteredCount(state: GameState): number {
  return BUILDINGS.filter((def) => selectBuildingMastery(state, def.id)).length;
}

export function selectIsSurgeActive(state: GameState): boolean {
  return selectMasteredCount(state) >= GAME_CONFIG.surge.masteryThreshold;
}

export function selectSurgeMultiplier(state: GameState): number {
  if (!state.surgeStartedAt) return 1;
  const elapsed = Math.max(0, (Date.now() - state.surgeStartedAt) / 1000);
  return GAME_CONFIG.surge.startMultiplier + Math.floor(elapsed / GAME_CONFIG.surge.intervalSec);
}

export function selectHasWon(state: GameState): boolean {
  return BUILDINGS.every((def) => selectBuildingMastery(state, def.id));
}
