import type { BuildingDefinition, UpgradeDefinition } from "../types/game";
import { MILESTONE_ICONS, UPGRADE_FLAVOR } from "./upgradeFlavor";

/** Cost multiplier relative to building baseCost for each tier (0-indexed: index 0 = tier 1) */
const TIER_COST_MULTIPLIERS = [
  10, 40, 150, 500, 2_000, 8_000, 30_000, 120_000, 500_000, 2_000_000, 10_000_000, 100_000_000, 1_000_000_000,
  5_000_000, 40_000_000, 200_000_000, 400_000_000, 700_000_000, 2_500_000_000, 5_000_000_000, 7_500_000_000,
] as const;

/** Production multiplier granted by each tier */
const TIER_EFFECT_MULTIPLIERS = [2, 2, 2, 2, 2, 3, 3, 3, 5, 3, 3, 5, 5, 3, 3, 3, 3, 5, 5, 5, 5] as const;

/**
 * Building count thresholds for each tier, in tier order (not ascending).
 * Same values as STANDARD_BUILDING_UPGRADE_LEVELS in standardUpgrades.ts but
 * ordered by tier progression: tiers 1-9 (10-200), 10-13 (250-500), 14-21 (225-475).
 */
const TIER_UNLOCK_COUNTS = [
  10, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 225, 275, 325, 350, 375, 425, 450, 475,
] as const;

const FLAVOR_TIER_COUNT = 13;
const TOTAL_TIERS = TIER_COST_MULTIPLIERS.length;

// Validate all tier arrays are consistent
if (TIER_EFFECT_MULTIPLIERS.length !== TOTAL_TIERS) {
  throw new Error(`TIER_EFFECT_MULTIPLIERS has ${TIER_EFFECT_MULTIPLIERS.length} entries, expected ${TOTAL_TIERS}.`);
}
if (TIER_UNLOCK_COUNTS.length !== TOTAL_TIERS) {
  throw new Error(`TIER_UNLOCK_COUNTS has ${TIER_UNLOCK_COUNTS.length} entries, expected ${TOTAL_TIERS}.`);
}
if (MILESTONE_ICONS.length !== TOTAL_TIERS - FLAVOR_TIER_COUNT) {
  throw new Error(
    `MILESTONE_ICONS has ${MILESTONE_ICONS.length} entries, expected ${TOTAL_TIERS - FLAVOR_TIER_COUNT}.`,
  );
}

export function generateBuildingUpgrades(buildings: readonly BuildingDefinition[]): UpgradeDefinition[] {
  const upgrades: UpgradeDefinition[] = [];

  for (const building of buildings) {
    const flavor = UPGRADE_FLAVOR[building.id];
    if (!flavor) {
      throw new Error(`Missing UPGRADE_FLAVOR entry for building "${building.id}".`);
    }
    if (flavor.length !== FLAVOR_TIER_COUNT) {
      throw new Error(`UPGRADE_FLAVOR["${building.id}"] has ${flavor.length} entries, expected ${FLAVOR_TIER_COUNT}.`);
    }

    for (let i = 0; i < TOTAL_TIERS; i++) {
      const tier = i + 1;
      const multiplier = TIER_EFFECT_MULTIPLIERS[i];

      if (i < FLAVOR_TIER_COUNT) {
        const f = flavor[i];
        upgrades.push({
          id: `${building.id}_${tier}`,
          name: f.name,
          description: f.description,
          cost: building.baseCost * TIER_COST_MULTIPLIERS[i],
          unlockCondition: { kind: "building_count", buildingId: building.id, count: TIER_UNLOCK_COUNTS[i] },
          effect: { kind: "building_boost", buildingId: building.id, multiplier },
          icon: f.icon,
          tier,
        });
      } else {
        const milestoneIndex = i - FLAVOR_TIER_COUNT;
        upgrades.push({
          id: `${building.id}_${tier}`,
          name: `${building.name} Milestone ${TIER_UNLOCK_COUNTS[i]}`,
          description: `Unlocks ${multiplier}x ${building.name} production.`,
          cost: building.baseCost * TIER_COST_MULTIPLIERS[i],
          unlockCondition: { kind: "building_count", buildingId: building.id, count: TIER_UNLOCK_COUNTS[i] },
          effect: { kind: "building_boost", buildingId: building.id, multiplier },
          icon: MILESTONE_ICONS[milestoneIndex],
          tier,
        });
      }
    }
  }

  return upgrades;
}
