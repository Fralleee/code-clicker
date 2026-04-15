import type { AchievementDefinition, BuildingDefinition, UpgradeDefinition } from "../types/game";
import { ACHIEVEMENTS } from "./achievements";
import { BUILDINGS } from "./buildings";
import { UPGRADES } from "./upgrades";

// O(1) lookup by ID
export const UPGRADE_BY_ID: ReadonlyMap<string, UpgradeDefinition> = new Map(UPGRADES.map((u) => [u.id, u]));
export const ACHIEVEMENT_BY_ID: ReadonlyMap<string, AchievementDefinition> = new Map(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);
export const BUILDING_BY_ID: ReadonlyMap<string, BuildingDefinition> = new Map(BUILDINGS.map((b) => [b.id, b]));

// Pre-grouped upgrade effects by kind + buildingId
const _buildingBoosts = new Map<string, { id: string; multiplier: number }[]>();
const _globalProduction: { id: string; multiplier: number }[] = [];
const _clickPower: { id: string; multiplier: number }[] = [];
const _cpsClick: { id: string; percent: number }[] = [];
const _tdReduction = new Map<string, { id: string; reduction: number }[]>();

for (const u of UPGRADES) {
  const e = u.effect;
  if (e.kind === "building_boost") {
    const list = _buildingBoosts.get(e.buildingId) ?? [];
    list.push({ id: u.id, multiplier: e.multiplier });
    _buildingBoosts.set(e.buildingId, list);
  } else if (e.kind === "global_production") {
    _globalProduction.push({ id: u.id, multiplier: e.multiplier });
  } else if (e.kind === "click_power") {
    _clickPower.push({ id: u.id, multiplier: e.multiplier });
  } else if (e.kind === "click_percent_of_cps") {
    _cpsClick.push({ id: u.id, percent: e.percent });
  } else if (e.kind === "td_reduction") {
    const list = _tdReduction.get(e.buildingId) ?? [];
    list.push({ id: u.id, reduction: e.reduction });
    _tdReduction.set(e.buildingId, list);
  }
}

export const BUILDING_BOOST_UPGRADES: ReadonlyMap<string, readonly { id: string; multiplier: number }[]> =
  _buildingBoosts;
export const GLOBAL_PRODUCTION_UPGRADES: readonly { id: string; multiplier: number }[] = _globalProduction;
export const CLICK_POWER_UPGRADES: readonly { id: string; multiplier: number }[] = _clickPower;
export const CPS_CLICK_UPGRADES: readonly { id: string; percent: number }[] = _cpsClick;
export const TD_REDUCTION_UPGRADES: ReadonlyMap<string, readonly { id: string; reduction: number }[]> = _tdReduction;
