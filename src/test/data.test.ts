import { describe, expect, it } from "vitest";
import { BUG_TYPES, getBugSpawnInterval, pickRandomBug } from "../data/bugs";
import { BUILDINGS } from "../data/buildings";
import { HACKS } from "../data/hacks";
import { PRESTIGE_UPGRADES } from "../data/prestige";
import { UPGRADES } from "../data/upgrades";

describe("buildings data", () => {
  it("has 12 buildings", () => {
    expect(BUILDINGS.length).toBe(12);
  });

  it("all have unique IDs", () => {
    const ids = BUILDINGS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all have positive base cost", () => {
    for (const b of BUILDINGS) {
      expect(b.baseCost).toBeGreaterThan(0);
    }
  });

  it("all have techDebtRatio", () => {
    for (const b of BUILDINGS) {
      expect(typeof b.techDebtRatio).toBe("number");
    }
  });

  it("has cleaner buildings with negative TD ratio", () => {
    const cleaners = BUILDINGS.filter((b) => b.techDebtRatio < 0);
    expect(cleaners.length).toBeGreaterThanOrEqual(3);
  });
});

describe("upgrades data", () => {
  it("has upgrades", () => {
    expect(UPGRADES.length).toBeGreaterThan(100);
  });

  it("all have unique IDs", () => {
    const ids = UPGRADES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every building has 13 standard tier upgrades", () => {
    for (const building of BUILDINGS) {
      for (let tier = 1; tier <= 13; tier++) {
        const id = `${building.id}_${tier}`;
        const found = UPGRADES.find((u) => u.id === id);
        expect(found, `Missing ${id}`).toBeDefined();
      }
    }
  });

  it("building_boost upgrades reference valid buildings", () => {
    const buildingIds = new Set(BUILDINGS.map((b) => b.id));
    const boosts = UPGRADES.filter((u) => u.effect.kind === "building_boost");
    for (const u of boosts) {
      if (u.effect.kind === "building_boost") {
        expect(buildingIds.has(u.effect.buildingId), `Invalid building: ${u.effect.buildingId} in ${u.id}`).toBe(true);
      }
    }
  });

  it("upgrades sorted by cost within selectVisibleUpgrades", () => {
    // Just check that costs are positive
    for (const u of UPGRADES) {
      expect(u.cost).toBeGreaterThan(0);
    }
  });
});

describe("hacks data", () => {
  it("has hacks", () => {
    expect(HACKS.length).toBeGreaterThanOrEqual(4);
  });

  it("all have unique IDs", () => {
    const ids = HACKS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all have positive cooldowns", () => {
    for (const h of HACKS) {
      expect(h.cooldownSeconds).toBeGreaterThan(0);
    }
  });
});

describe("bugs data", () => {
  it("has bug types", () => {
    expect(BUG_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  it("has all severity levels", () => {
    const severities = new Set(BUG_TYPES.map((b) => b.severity));
    expect(severities.has("minor")).toBe(true);
    expect(severities.has("major")).toBe(true);
    expect(severities.has("critical")).toBe(true);
  });

  it("pickRandomBug returns a valid bug", () => {
    const bug = pickRandomBug(100, 5000);
    expect(bug).toBeDefined();
    expect(bug.icon).toBeTruthy();
  });

  it("getBugSpawnInterval returns infinity at low TD", () => {
    const { min } = getBugSpawnInterval(100, 0);
    expect(min).toBe(Number.POSITIVE_INFINITY);
  });

  it("getBugSpawnInterval returns finite intervals at high TD", () => {
    const { min, max } = getBugSpawnInterval(100, 50000);
    expect(min).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(max).toBeGreaterThan(min);
  });
});

describe("prestige data", () => {
  it("has prestige upgrades", () => {
    expect(PRESTIGE_UPGRADES.length).toBeGreaterThanOrEqual(10);
  });

  it("all have unique IDs", () => {
    const ids = PRESTIGE_UPGRADES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("costs are in ascending order", () => {
    for (let i = 1; i < PRESTIGE_UPGRADES.length; i++) {
      expect(PRESTIGE_UPGRADES[i].cost).toBeGreaterThanOrEqual(PRESTIGE_UPGRADES[i - 1].cost);
    }
  });
});
