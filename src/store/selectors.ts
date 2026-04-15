import { ACHIEVEMENTS } from "../data/achievements";
import { BUILDINGS } from "../data/buildings";
import { BASE_PRESTIGE_THRESHOLD, getPrestigeThreshold } from "../data/prestige";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import { UPGRADES } from "../data/upgrades";
import type { GameState } from "../types/game";

// === Prestige Multipliers ===

export function selectPrestigeMultiplier(state: GameState): number {
  return 1 + state.prestige.totalReputationEarned * 0.01;
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
  return mult;
}

export function selectPrestigeProductionBonus(state: GameState): number {
  let mult = 1;
  if (state.prestige.prestigeUpgrades.includes("scaling_expert")) mult *= 1.25;
  if (state.prestige.prestigeUpgrades.includes("double_down")) mult *= 1.5;
  return mult;
}

export function selectCleanStartMultiplier(state: GameState): number {
  if (!state.prestige.prestigeUpgrades.includes("clean_start")) return 1;
  // 50% less TD generation in first 60 seconds of a run
  const elapsed = state.stats.totalTimePlayed;
  if (elapsed < 60) return 0.5;
  return 1;
}

// === Achievement Bonuses ===

export function selectAchievementProductionBonus(state: GameState): number {
  let multiplier = 1;
  for (const achId of state.unlockedAchievements) {
    const ach = ACHIEVEMENTS.find((a) => a.id === achId);
    if (ach?.reward?.kind === "production_bonus") {
      multiplier *= ach.reward.multiplier;
    }
  }
  return multiplier;
}

export function selectAchievementClickBonus(state: GameState): number {
  let multiplier = 1;
  for (const achId of state.unlockedAchievements) {
    const ach = ACHIEVEMENTS.find((a) => a.id === achId);
    if (ach?.reward?.kind === "click_bonus") {
      multiplier *= ach.reward.multiplier;
    }
  }
  return multiplier;
}

// === Upgrade Multipliers ===

export function selectBuildingMultiplier(state: GameState, buildingId: string): number {
  let multiplier = 1;
  for (const upId of state.purchasedUpgrades) {
    const upgrade = UPGRADES.find((u) => u.id === upId);
    if (upgrade?.effect.kind === "building_boost" && upgrade.effect.buildingId === buildingId) {
      multiplier *= upgrade.effect.multiplier;
    }
  }
  return multiplier;
}

export function selectGlobalProductionMultiplier(state: GameState): number {
  let multiplier = 1;
  for (const upId of state.purchasedUpgrades) {
    const upgrade = UPGRADES.find((u) => u.id === upId);
    if (upgrade?.effect.kind === "global_production") {
      multiplier *= upgrade.effect.multiplier;
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

// === Technical Debt ===

/** Raw LoC/s WITHOUT tech debt penalty (used to scale the TD penalty formula) */
export function selectRawLocPerSecond(state: GameState): number {
  let total = 0;
  for (const def of BUILDINGS) {
    const owned = state.buildings.find((b) => b.id === def.id);
    if (!def || !owned || owned.count === 0) continue;
    total +=
      owned.count *
      def.baseProduction *
      selectBuildingMultiplier(state, def.id) *
      selectGlobalProductionMultiplier(state) *
      selectPrestigeMultiplier(state) *
      selectAchievementProductionBonus(state) *
      selectAngelInvestorBonus(state) *
      selectActiveBuffProductionMultiplier(state) *
      selectPrestigeProductionBonus(state);
  }
  return total;
}

export function selectTechDebtMultiplier(state: GameState): number {
  const td = state.resources.techDebt ?? 0;
  if (td <= 0) return 1;
  // Divisor scales with production: ~15s of accumulated TD ≈ 50% penalty
  const rawLocPerSec = selectRawLocPerSecond(state);
  const divisor = Math.max(1000, rawLocPerSec * 15);
  const penalty = 0.75 * (1 - Math.exp(-td / divisor));
  return Math.max(0.25, 1 - penalty);
}

function selectTdReduction(state: GameState, buildingId: string): number {
  let reduction = 1;
  for (const upId of state.purchasedUpgrades) {
    const upgrade = UPGRADES.find((u) => u.id === upId);
    if (upgrade?.effect.kind === "td_reduction" && upgrade.effect.buildingId === buildingId) {
      reduction *= 1 - upgrade.effect.reduction;
    }
  }
  return reduction;
}

function selectCleanerUpgradeBonus(state: GameState, buildingId: string, techDebtRatio: number): number {
  if (techDebtRatio >= 0) return 1;

  const standardIds = getStandardUpgradeIds(buildingId);
  let buildingBoosts = 0;
  for (const id of standardIds) {
    if (state.purchasedUpgrades.includes(id)) {
      buildingBoosts += 1;
    }
  }

  return 1 + buildingBoosts * 0.1;
}

export function selectNetTechDebtPerSecond(state: GameState): number {
  let total = 0;
  for (const def of BUILDINGS) {
    const owned = state.buildings.find((b) => b.id === def.id);
    if (!owned || owned.count === 0) continue;
    const buildingMult = selectBuildingMultiplier(state, def.id);
    let tdRate = owned.count * def.baseProduction * def.techDebtRatio * buildingMult;
    // TD reduction upgrades only apply to positive (debt-generating) buildings
    if (tdRate > 0) {
      tdRate *= selectTdReduction(state, def.id);
    } else if (tdRate < 0) {
      tdRate *= selectCleanerUpgradeBonus(state, def.id, def.techDebtRatio);
    }
    total += tdRate;
  }
  // Clean Codebase prestige upgrade: 50% less TD in first 60s
  // Only reduce positive (generation) part, not negative (cleanup) part
  if (total > 0) {
    total *= selectCleanStartMultiplier(state);
  }
  return total;
}

// === Building Production ===

/** Mastery: 500 count + all standard tier upgrades purchased → mirrors highest building production */
export function selectBuildingMastery(state: GameState, buildingId: string): boolean {
  const owned = state.buildings.find((b) => b.id === buildingId);
  if (!owned || owned.count < 500) return false;
  // Only check standard tier upgrades, not cross-building, early, or td_reduction upgrades.
  for (const upgradeId of getStandardUpgradeIds(buildingId)) {
    if (!state.purchasedUpgrades.includes(upgradeId)) {
      return false;
    }
  }
  return true;
}

function selectBuildingProductionBeforeMastery(state: GameState, buildingId: string): number {
  const def = BUILDINGS.find((b) => b.id === buildingId);
  const owned = state.buildings.find((b) => b.id === buildingId);
  if (!def || !owned || owned.count === 0) return 0;

  return (
    owned.count *
    def.baseProduction *
    selectBuildingMultiplier(state, buildingId) *
    selectGlobalProductionMultiplier(state) *
    selectPrestigeMultiplier(state) *
    selectAchievementProductionBonus(state) *
    selectAngelInvestorBonus(state) *
    selectActiveBuffProductionMultiplier(state) *
    selectPrestigeProductionBonus(state) *
    selectTechDebtMultiplier(state)
  );
}

let _highestCache: { state: GameState; value: number } | null = null;

function selectHighestProductionBeforeMastery(state: GameState): number {
  if (_highestCache && _highestCache.state === state) return _highestCache.value;
  let max = 0;
  for (const def of BUILDINGS) {
    const prod = selectBuildingProductionBeforeMastery(state, def.id);
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
  let total = 0;
  for (const building of BUILDINGS) {
    total += selectBuildingProduction(state, building.id);
  }
  return total;
}

// === Click Value ===

export function selectClickPowerMultiplier(state: GameState): number {
  let multiplier = 1;
  for (const upId of state.purchasedUpgrades) {
    const upgrade = UPGRADES.find((u) => u.id === upId);
    if (upgrade?.effect.kind === "click_power") {
      multiplier *= upgrade.effect.multiplier;
    }
  }
  return multiplier;
}

export function selectCpsClickPercent(state: GameState): number {
  let percent = 0;
  for (const upId of state.purchasedUpgrades) {
    const upgrade = UPGRADES.find((u) => u.id === upId);
    if (upgrade?.effect.kind === "click_percent_of_cps") {
      percent += upgrade.effect.percent;
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
  // Peak tech debt bonus: up to +10% at 10K peak TD
  const peakTD = state.resources.peakTechDebt ?? 0;
  if (peakTD > 0) {
    rep = Math.floor(rep * (1 + Math.min(peakTD / 10_000, 1) * 0.1));
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
  return UPGRADES.filter((upgrade): boolean => {
    if (state.purchasedUpgrades.includes(upgrade.id)) return false;
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

export function selectHasWon(state: GameState): boolean {
  // Win = every building has mastery (500 count + all its upgrades)
  return BUILDINGS.every((def) => selectBuildingMastery(state, def.id));
}
