import { afterEach, describe, expect, it } from "vitest";
import { getStandardUpgradeIds } from "../data/standardUpgrades";
import { useGameStore } from "../store/gameStore";

function resetStore() {
  useGameStore.getState().resetGame();
}

describe("gameStore", () => {
  afterEach(resetStore);

  describe("click", () => {
    it("increases LoC and click count", () => {
      const value = useGameStore.getState().click();
      expect(value).toBeGreaterThanOrEqual(1);
      expect(useGameStore.getState().resources.linesOfCode).toBeGreaterThan(0);
      expect(useGameStore.getState().resources.totalClicks).toBe(1);
    });

    it("accumulates over multiple clicks", () => {
      useGameStore.getState().click();
      useGameStore.getState().click();
      useGameStore.getState().click();
      expect(useGameStore.getState().resources.totalClicks).toBe(3);
    });
  });

  describe("buyBuilding", () => {
    it("buys a building when affordable", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 1000,
        },
      });
      const result = useGameStore.getState().buyBuilding("intern");
      expect(result).toBe(true);
      const intern = useGameStore.getState().buildings.find((b) => b.id === "intern");
      expect(intern?.count).toBe(1);
    });

    it("fails when not affordable", () => {
      const result = useGameStore.getState().buyBuilding("junior_dev");
      expect(result).toBe(false);
    });

    it("respects 500 cap", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 1e30,
        },
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 500 } : b)),
      });
      const result = useGameStore.getState().buyBuilding("intern");
      expect(result).toBe(false);
    });

    it("deducts LoC on purchase", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 1000,
        },
      });
      const before = useGameStore.getState().resources.linesOfCode;
      useGameStore.getState().buyBuilding("intern");
      const after = useGameStore.getState().resources.linesOfCode;
      expect(after).toBeLessThan(before);
    });
  });

  describe("buyUpgrade", () => {
    it("buys an upgrade and deducts LoC", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 100,
          totalClicks: 10,
        },
      });
      // faster_fingers costs 15, unlocks at 3 clicks
      const result = useGameStore.getState().buyUpgrade("faster_fingers");
      expect(result).toBe(true);
      expect(useGameStore.getState().purchasedUpgrades.includes("faster_fingers")).toBe(true);
    });

    it("prevents duplicate purchase", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 1000,
          totalClicks: 10,
        },
        purchasedUpgrades: ["faster_fingers"],
      });
      const result = useGameStore.getState().buyUpgrade("faster_fingers");
      expect(result).toBe(false);
    });
  });

  describe("tick", () => {
    it("increases LoC from building production", () => {
      useGameStore.setState({
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 10 } : b)),
      });
      const before = useGameStore.getState().resources.linesOfCode;
      useGameStore.getState().tick(1000); // 1 second
      const after = useGameStore.getState().resources.linesOfCode;
      expect(after).toBeGreaterThan(before);
    });

    it("accumulates tech debt from buildings", () => {
      useGameStore.setState({
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 50 } : b)),
      });
      useGameStore.getState().tick(1000);
      expect(useGameStore.getState().resources.techDebt).toBeGreaterThan(0);
    });

    it("pauses production during refactoring", () => {
      useGameStore.setState({
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 100 } : b)),
        refactoringUntil: Date.now() + 60_000,
      });
      const before = useGameStore.getState().resources.linesOfCode;
      useGameStore.getState().tick(1000);
      const after = useGameStore.getState().resources.linesOfCode;
      expect(after).toBe(before); // no production during refactoring
    });
  });

  describe("refactorDebt", () => {
    it("removes 70% of tech debt", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          techDebt: 1000,
        },
      });
      const result = useGameStore.getState().refactorDebt();
      expect(result).toBe(true);
      expect(useGameStore.getState().resources.techDebt).toBeCloseTo(300, 0);
    });

    it("fails with 0 debt", () => {
      expect(useGameStore.getState().refactorDebt()).toBe(false);
    });

    it("sets refactoringUntil", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          techDebt: 1000,
        },
      });
      useGameStore.getState().refactorDebt();
      expect(useGameStore.getState().refactoringUntil).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe("activateHack", () => {
    it("fails without hack_access prestige upgrade", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 100_000,
          totalLoCEarned: 100_000,
        },
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 50 } : b)),
      });
      expect(useGameStore.getState().activateHack("spaghetti_sprint")).toBe(false);
    });

    it("adds tech debt and sets cooldown with hack_access", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 100_000,
          totalLoCEarned: 100_000,
        },
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 50 } : b)),
        prestige: {
          ...useGameStore.getState().prestige,
          prestigeUpgrades: ["hack_access"],
        },
      });
      const tdBefore = useGameStore.getState().resources.techDebt;
      const result = useGameStore.getState().activateHack("spaghetti_sprint");
      expect(result).toBe(true);
      expect(useGameStore.getState().resources.techDebt).toBeGreaterThan(tdBefore);
      expect(useGameStore.getState().hackCooldowns.spaghetti_sprint).toBeGreaterThan(Date.now());
    });

    it("fails when on cooldown", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          totalLoCEarned: 100_000,
        },
        prestige: {
          ...useGameStore.getState().prestige,
          prestigeUpgrades: ["hack_access"],
        },
        hackCooldowns: { spaghetti_sprint: Date.now() + 60_000 },
      });
      expect(useGameStore.getState().activateHack("spaghetti_sprint")).toBe(false);
    });
  });

  describe("surge state", () => {
    it("sets surgeStartedAt when 9 buildings mastered", () => {
      // Master 9 buildings
      const upgrades: string[] = [];
      const buildings = useGameStore.getState().buildings.map((b, i) => {
        if (i < 9) {
          upgrades.push(...getStandardUpgradeIds(b.id));
          return { ...b, count: 500 };
        }
        return b;
      });
      useGameStore.setState({ buildings, purchasedUpgrades: upgrades });

      expect(useGameStore.getState().surgeStartedAt).toBeNull();
      useGameStore.getState().tick(50);
      expect(useGameStore.getState().surgeStartedAt).not.toBeNull();
    });

    it("does not set surgeStartedAt below threshold", () => {
      useGameStore.getState().tick(50);
      expect(useGameStore.getState().surgeStartedAt).toBeNull();
    });
  });

  describe("shipProduct", () => {
    it("resets buildings and LoC", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 5_000_000,
          totalLoCEarned: 5_000_000,
        },
        buildings: useGameStore.getState().buildings.map((b) => (b.id === "intern" ? { ...b, count: 100 } : b)),
      });
      useGameStore.getState().shipProduct();
      expect(useGameStore.getState().resources.totalLoCEarned).toBe(0);
      expect(useGameStore.getState().buildings.find((b) => b.id === "intern")?.count).toBe(0);
      expect(useGameStore.getState().prestige.timesShipped).toBeGreaterThanOrEqual(1);
    });

    it("earns reputation", () => {
      useGameStore.setState({
        resources: {
          ...useGameStore.getState().resources,
          linesOfCode: 10_000_000,
          totalLoCEarned: 10_000_000,
        },
      });
      useGameStore.getState().shipProduct();
      expect(useGameStore.getState().prestige.totalReputationEarned).toBeGreaterThan(0);
    });
  });
});
