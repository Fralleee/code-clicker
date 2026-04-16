import { BUILDING_BOOST_UPGRADES } from "../data/lookups";

/** Compute the building-specific upgrade multiplier (building_boost effects). */
export function computeBuildingMultiplier(buildingId: string, purchasedSet: Set<string>): number {
  let multiplier = 1;
  for (const boost of BUILDING_BOOST_UPGRADES.get(buildingId) ?? []) {
    if (purchasedSet.has(boost.id)) {
      multiplier *= boost.multiplier;
    }
  }
  return multiplier;
}
