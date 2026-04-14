import type { BuildingDefinition, BuyQuantity } from "../types/game";

export function calculateBuildingCost(
  building: BuildingDefinition,
  owned: number,
  quantity: number = 1,
): number {
  if (quantity === 1) {
    return Math.floor(building.baseCost * building.costMultiplier ** owned);
  }
  // Geometric series sum for bulk buy
  const r = building.costMultiplier;
  const base = building.baseCost * r ** owned;
  return Math.floor((base * (r ** quantity - 1)) / (r - 1));
}

export const MAX_BUILDING_COUNT = 500;

export function calculateMaxAffordable(
  building: BuildingDefinition,
  owned: number,
  budget: number,
): number {
  if (budget <= 0) return 0;
  const maxBuy = MAX_BUILDING_COUNT - owned;
  if (maxBuy <= 0) return 0;
  let count = 0;
  let totalCost = 0;
  while (count < maxBuy) {
    const nextCost = Math.floor(
      building.baseCost * building.costMultiplier ** (owned + count),
    );
    if (totalCost + nextCost > budget) break;
    totalCost += nextCost;
    count++;
  }
  return count;
}

export function resolveQuantity(
  quantity: BuyQuantity,
  building: BuildingDefinition,
  owned: number,
  budget: number,
): number {
  if (quantity === "max") {
    return calculateMaxAffordable(building, owned, budget);
  }
  return quantity;
}
