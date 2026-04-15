import type { AchievementDefinition, BuildingDefinition, UpgradeDefinition } from "../types/game";
import { ACHIEVEMENTS } from "./achievements";
import { BUILDINGS } from "./buildings";
import { UPGRADES } from "./upgrades";

// O(1) lookup by ID
export const UPGRADE_BY_ID = new Map<string, UpgradeDefinition>(UPGRADES.map((u) => [u.id, u]));
export const ACHIEVEMENT_BY_ID = new Map<string, AchievementDefinition>(ACHIEVEMENTS.map((a) => [a.id, a]));
export const BUILDING_BY_ID = new Map<string, BuildingDefinition>(BUILDINGS.map((b) => [b.id, b]));

// Pre-grouped upgrade effects by kind + buildingId
export const BUILDING_BOOST_UPGRADES = new Map<string, { id: string; multiplier: number }[]>();
export const GLOBAL_PRODUCTION_UPGRADES: { id: string; multiplier: number }[] = [];
export const CLICK_POWER_UPGRADES: { id: string; multiplier: number }[] = [];
export const CPS_CLICK_UPGRADES: { id: string; percent: number }[] = [];
export const TD_REDUCTION_UPGRADES = new Map<string, { id: string; reduction: number }[]>();

for (const u of UPGRADES) {
  const e = u.effect;
  if (e.kind === "building_boost") {
    const list = BUILDING_BOOST_UPGRADES.get(e.buildingId) ?? [];
    list.push({ id: u.id, multiplier: e.multiplier });
    BUILDING_BOOST_UPGRADES.set(e.buildingId, list);
  } else if (e.kind === "global_production") {
    GLOBAL_PRODUCTION_UPGRADES.push({ id: u.id, multiplier: e.multiplier });
  } else if (e.kind === "click_power") {
    CLICK_POWER_UPGRADES.push({ id: u.id, multiplier: e.multiplier });
  } else if (e.kind === "click_percent_of_cps") {
    CPS_CLICK_UPGRADES.push({ id: u.id, percent: e.percent });
  } else if (e.kind === "td_reduction") {
    const list = TD_REDUCTION_UPGRADES.get(e.buildingId) ?? [];
    list.push({ id: u.id, reduction: e.reduction });
    TD_REDUCTION_UPGRADES.set(e.buildingId, list);
  }
}
