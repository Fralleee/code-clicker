import { describe, expect, it } from "vitest";
import { BUILDINGS } from "../data/buildings";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import {
  selectBuildingMastery,
  selectBuildingMultiplier,
  selectBuildingProduction,
  selectClickValue,
  selectHasWon,
  selectLocPerSecond,
  selectNetTechDebtPerSecond,
  selectPrestigeMultiplier,
  selectRawLocPerSecond,
  selectTechDebtMultiplier,
  selectTotalBuildings,
} from "../store/selectors";
import type { GameState } from "../types/game";

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    resources: {
      linesOfCode: 0,
      totalLoCEarned: 0,
      totalClicks: 0,
      totalLoCFromClicks: 0,
      techDebt: 0,
      totalTechDebtEarned: 0,
      peakTechDebt: 0,
    },
    buildings: BUILDINGS.map((b) => ({ id: b.id, count: 0, totalProduced: 0 })),
    purchasedUpgrades: [],
    unlockedAchievements: [],
    activeBuffs: [],
    hackCooldowns: {},
    prestige: {
      reputationPoints: 0,
      totalReputationEarned: 0,
      timesShipped: 0,
      prestigeUpgrades: [],
      lifetimeLoCEarned: 0,
    },
    settings: { autoSaveEnabled: true, particlesEnabled: true },
    stats: {
      totalTimePlayed: 0,
      fastestPrestige: null,
      highestLocPerSecond: 0,
      highestSingleClick: 0,
      startedAt: Date.now(),
    },
    refactoringUntil: 0,
    lastSaveTimestamp: Date.now(),
    lastTickTimestamp: Date.now(),
    gameVersion: "1.0.0",
    ...overrides,
  };
}

function withBuildings(state: GameState, counts: Record<string, number>): GameState {
  return {
    ...state,
    buildings: state.buildings.map((b) => ({
      ...b,
      count: counts[b.id] ?? b.count,
    })),
  };
}

describe("selectPrestigeMultiplier", () => {
  it("returns 1 with 0 reputation", () => {
    const state = createTestState();
    expect(selectPrestigeMultiplier(state)).toBe(1);
  });

  it("adds 1% per reputation point", () => {
    const state = createTestState({
      prestige: {
        reputationPoints: 0,
        totalReputationEarned: 100,
        timesShipped: 1,
        prestigeUpgrades: [],
        lifetimeLoCEarned: 0,
      },
    });
    expect(selectPrestigeMultiplier(state)).toBe(2); // 1 + 100*0.01
  });
});

describe("selectBuildingProduction", () => {
  it("returns 0 for unowned buildings", () => {
    const state = createTestState();
    expect(selectBuildingProduction(state, "intern")).toBe(0);
  });

  it("returns base production for 1 unit", () => {
    const state = withBuildings(createTestState(), { intern: 1 });
    const prod = selectBuildingProduction(state, "intern");
    // 1 * 0.2 * (no upgrades=1) * ... * (no TD penalty=1) = 0.2
    expect(prod).toBeCloseTo(0.2, 1);
  });

  it("scales with count", () => {
    const state = withBuildings(createTestState(), { intern: 10 });
    const prod = selectBuildingProduction(state, "intern");
    expect(prod).toBeCloseTo(2, 1);
  });

  it("applies upgrade multiplier", () => {
    let state = withBuildings(createTestState(), { intern: 10 });
    state = { ...state, purchasedUpgrades: ["intern_1"] }; // 2x
    const prod = selectBuildingProduction(state, "intern");
    expect(prod).toBeCloseTo(4, 1); // 10 * 0.2 * 2
  });

  it("applies tech debt penalty", () => {
    const baseState = withBuildings(createTestState(), { intern: 10 });
    const noPenalty = selectBuildingProduction(baseState, "intern");

    const tdState = {
      ...baseState,
      resources: { ...baseState.resources, techDebt: 100_000 },
    };
    const withPenalty = selectBuildingProduction(tdState, "intern");

    expect(withPenalty).toBeLessThan(noPenalty);
  });
});

describe("selectLocPerSecond", () => {
  it("returns 0 with no buildings", () => {
    expect(selectLocPerSecond(createTestState())).toBe(0);
  });

  it("sums all building production", () => {
    const state = withBuildings(createTestState(), {
      intern: 10,
      junior_dev: 5,
    });
    const total = selectLocPerSecond(state);
    expect(total).toBeCloseTo(10 * 0.2 + 5 * 8, 1);
  });
});

describe("selectTechDebtMultiplier", () => {
  it("returns 1 with no debt", () => {
    expect(selectTechDebtMultiplier(createTestState())).toBe(1);
  });

  it("reduces production with debt", () => {
    const state = {
      ...withBuildings(createTestState(), { intern: 100 }),
      resources: {
        ...createTestState().resources,
        techDebt: 1_000_000,
      },
    };
    const mult = selectTechDebtMultiplier(state);
    expect(mult).toBeLessThan(1);
    expect(mult).toBeGreaterThanOrEqual(0.25); // floor
  });

  it("never goes below 0.25", () => {
    const state = {
      ...withBuildings(createTestState(), { intern: 1 }),
      resources: {
        ...createTestState().resources,
        techDebt: 1e15,
      },
    };
    expect(selectTechDebtMultiplier(state)).toBeGreaterThanOrEqual(0.25);
  });
});

describe("selectNetTechDebtPerSecond", () => {
  it("returns 0 with no buildings", () => {
    expect(selectNetTechDebtPerSecond(createTestState())).toBe(0);
  });

  it("interns generate positive TD", () => {
    const state = withBuildings(createTestState(), { intern: 10 });
    expect(selectNetTechDebtPerSecond(state)).toBeGreaterThan(0);
  });

  it("senior devs generate negative TD (cleanup)", () => {
    const state = withBuildings(createTestState(), { senior_dev: 10 });
    expect(selectNetTechDebtPerSecond(state)).toBeLessThan(0);
  });

  it("cleaner upgrades increase TD cleanup", () => {
    const base = withBuildings(createTestState(), { senior_dev: 10 });
    const upgraded = {
      ...base,
      purchasedUpgrades: ["senior_dev_1"],
    };

    expect(selectNetTechDebtPerSecond(upgraded)).toBeLessThan(selectNetTechDebtPerSecond(base) * 2);
  });

  it("mixed buildings can balance out", () => {
    const state = withBuildings(createTestState(), {
      intern: 10,
      senior_dev: 10,
    });
    const net = selectNetTechDebtPerSecond(state);
    // Senior devs should offset intern TD significantly
    const internOnly = withBuildings(createTestState(), { intern: 10 });
    expect(net).toBeLessThan(selectNetTechDebtPerSecond(internOnly));
  });
});

describe("selectRawLocPerSecond", () => {
  it("ignores tech debt penalty", () => {
    const base = withBuildings(createTestState(), { intern: 100 });
    const withTD = {
      ...base,
      resources: { ...base.resources, techDebt: 1e10 },
    };
    const raw = selectRawLocPerSecond(withTD);
    const actual = selectLocPerSecond(withTD);
    expect(raw).toBeGreaterThan(actual);
  });
});

describe("selectClickValue", () => {
  it("returns at least 1 with no upgrades", () => {
    expect(selectClickValue(createTestState())).toBeGreaterThanOrEqual(1);
  });

  it("multiplied by click upgrade", () => {
    const state = {
      ...createTestState(),
      purchasedUpgrades: ["faster_fingers"], // 2x click power
    };
    expect(selectClickValue(state)).toBeGreaterThanOrEqual(2);
  });
});

describe("selectBuildingMultiplier", () => {
  it("returns 1 with no upgrades", () => {
    expect(selectBuildingMultiplier(createTestState(), "intern")).toBe(1);
  });

  it("stacks multiplicatively", () => {
    const state = {
      ...createTestState(),
      purchasedUpgrades: ["intern_1", "intern_2"], // 2x * 2x
    };
    expect(selectBuildingMultiplier(state, "intern")).toBe(4);
  });
});

describe("selectBuildingMastery", () => {
  it("returns false without 500 count", () => {
    const state = withBuildings(createTestState(), { intern: 499 });
    expect(selectBuildingMastery(state, "intern")).toBe(false);
  });

  it("returns false without all upgrades", () => {
    const state = withBuildings(createTestState(), { intern: 500 });
    expect(selectBuildingMastery(state, "intern")).toBe(false);
  });

  it("returns true with 500 count + all standard tiers", () => {
    const upgrades = getStandardUpgradeIds("intern");
    let state = withBuildings(createTestState(), { intern: 500 });
    state = { ...state, purchasedUpgrades: upgrades };
    expect(selectBuildingMastery(state, "intern")).toBe(true);
  });
});

describe("selectHasWon", () => {
  it("returns false initially", () => {
    expect(selectHasWon(createTestState())).toBe(false);
  });

  it("returns true when all buildings mastered", () => {
    const counts: Record<string, number> = {};
    const upgrades: string[] = [];
    for (const b of BUILDINGS) {
      counts[b.id] = 500;
      upgrades.push(...getStandardUpgradeIds(b.id));
    }
    let state = withBuildings(createTestState(), counts);
    state = { ...state, purchasedUpgrades: upgrades };
    expect(selectHasWon(state)).toBe(true);
  });
});

describe("selectTotalBuildings", () => {
  it("sums all building counts", () => {
    const state = withBuildings(createTestState(), {
      intern: 5,
      junior_dev: 3,
    });
    expect(selectTotalBuildings(state)).toBe(8);
  });
});
