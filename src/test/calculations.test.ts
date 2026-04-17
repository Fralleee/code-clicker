import { describe, expect, it } from "vitest";
import { BUILDINGS } from "../data/buildings";
import { calculateBuildingCost, calculateMaxAffordable, MAX_BUILDING_COUNT } from "../utils/calculations";

describe("calculateBuildingCost", () => {
  const intern = BUILDINGS[0];

  it("returns base cost for first unit", () => {
    expect(calculateBuildingCost(intern, 0)).toBe(15);
  });

  it("scales cost with owned count", () => {
    const cost1 = calculateBuildingCost(intern, 1);
    expect(cost1).toBe(Math.floor(15 * intern.costMultiplier));
  });

  it("increases exponentially", () => {
    const cost0 = calculateBuildingCost(intern, 0);
    const cost10 = calculateBuildingCost(intern, 10);
    expect(cost10).toBeGreaterThan(cost0 * 3);
  });
});

describe("calculateMaxAffordable", () => {
  const intern = BUILDINGS[0];

  it("returns 0 with no budget", () => {
    expect(calculateMaxAffordable(intern, 0, 0)).toBe(0);
  });

  it("can afford at least 1 with enough budget", () => {
    expect(calculateMaxAffordable(intern, 0, 15)).toBe(1);
  });

  it("respects the 500 cap", () => {
    // At 500 owned, can't buy any more regardless of budget
    expect(calculateMaxAffordable(intern, 500, Number.MAX_VALUE)).toBe(0);
    // At 498 owned, can buy at most 2 more
    expect(calculateMaxAffordable(intern, 498, Number.MAX_VALUE)).toBeLessThanOrEqual(2);
  });

  it("MAX_BUILDING_COUNT is 500", () => {
    expect(MAX_BUILDING_COUNT).toBe(500);
  });
});
