import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GAME_CONFIG } from "../config/gameConfig";
import { BUILDINGS } from "../data/buildings";
import { HACKS } from "../data/hacks";
import { getPrestigeThreshold, PRESTIGE_UPGRADES } from "../data/prestige";
import { UPGRADES } from "../data/upgrades";
import type { GameState, GameStore, OwnedBuilding } from "../types/game";
import { calculateBuildingCost } from "../utils/calculations";
import {
  clearSave,
  exportSave as doExport,
  importSave as doImport,
  loadFromStorage,
  saveToStorage,
} from "../utils/saveManager";
import {
  selectBuildingProduction,
  selectClickValue,
  selectCostReduction,
  selectLocPerSecond,
  selectNetTechDebtPerSecond,
  selectReputationOnPrestige,
} from "./selectors";

function getStartingLoC(prestigeUpgrades: string[]): number {
  let loc = 0;
  if (prestigeUpgrades.includes("head_start")) loc += 1_000;
  if (prestigeUpgrades.includes("venture_capital")) loc += 10_000;
  if (prestigeUpgrades.includes("code_legacy")) loc += 100_000;
  return loc;
}

const MASS_HIRING_BUILDINGS = ["intern", "junior_dev", "senior_dev"];

function createInitialBuildingsWithBonuses(prestigeUpgrades: string[]): OwnedBuilding[] {
  const hasMassHiring = prestigeUpgrades.includes("mass_hiring");
  return BUILDINGS.map((b) => {
    let count = 0;
    if (b.id === "senior_dev" && prestigeUpgrades.includes("senior_network")) count += 1;
    if (b.id === "devops" && prestigeUpgrades.includes("free_devops")) count += 1;
    if (hasMassHiring && MASS_HIRING_BUILDINGS.includes(b.id)) count += 5;
    return { id: b.id, count, totalProduced: 0 };
  });
}

function createInitialState(
  prestige?: GameState["prestige"],
  achievements?: string[],
  stats?: GameState["stats"],
): GameState {
  const prestigeState = prestige ?? {
    reputationPoints: 0,
    totalReputationEarned: 0,
    timesShipped: 0,
    prestigeUpgrades: [],
    lifetimeLoCEarned: 0,
  };
  const startLoC = getStartingLoC(prestigeState.prestigeUpgrades);
  return {
    resources: {
      linesOfCode: startLoC,
      totalLoCEarned: startLoC,
      totalClicks: 0,
      totalLoCFromClicks: 0,
      techDebt: 0,
      totalTechDebtEarned: 0,
      peakTechDebt: 0,
    },
    buildings: createInitialBuildingsWithBonuses(prestigeState.prestigeUpgrades),
    purchasedUpgrades: [],
    unlockedAchievements: achievements ?? [],
    activeBuffs: [],
    hackCooldowns: {},
    refactoringUntil: 0,
    prestige: prestigeState,
    settings: {
      autoSaveEnabled: true,
      particlesEnabled: true,
    },
    stats: stats ?? {
      totalTimePlayed: 0,
      fastestPrestige: null,
      highestLocPerSecond: 0,
      highestSingleClick: 0,
      startedAt: Date.now(),
    },
    lastSaveTimestamp: Date.now(),
    lastTickTimestamp: Date.now(),
    gameVersion: "1.0.0",
  };
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...createInitialState(),

    click: () => {
      const state = get();
      const value = selectClickValue(state);

      set({
        resources: {
          ...state.resources,
          linesOfCode: Math.max(0, state.resources.linesOfCode + value),
          totalLoCEarned: state.resources.totalLoCEarned + Math.max(0, value),
          totalClicks: state.resources.totalClicks + 1,
          totalLoCFromClicks: state.resources.totalLoCFromClicks + Math.max(0, value),
        },
        stats: {
          ...state.stats,
          highestSingleClick: Math.max(state.stats.highestSingleClick, value),
        },
      });
      return value;
    },

    tick: (deltaMs: number) => {
      const state = get();
      const deltaSec = deltaMs / 1000;

      // Check if refactoring (paused production)
      const isRefactoring = (state.refactoringUntil ?? 0) > Date.now();

      // LoC production (paused during refactoring)
      const locPerSecond = isRefactoring ? 0 : selectLocPerSecond(state);
      const locEarned = locPerSecond * deltaSec;
      const newLoC = Math.max(0, state.resources.linesOfCode + locEarned);
      const locGain = Math.max(0, locEarned);

      // Tech Debt from all buildings (frozen if Code Freeze hack active)
      const isTdFrozen = state.activeBuffs.some((b) => b.expiresAt > Date.now() && b.tdFreeze);
      const netTdPerSec = isTdFrozen ? 0 : selectNetTechDebtPerSecond(state);
      const tdChange = netTdPerSec * deltaSec;
      const newTD = Math.max(0, (state.resources.techDebt ?? 0) + tdChange);

      const updatedBuildings = state.buildings.map((b) => {
        const prod = selectBuildingProduction(state, b.id);
        return {
          ...b,
          totalProduced: b.totalProduced + Math.max(0, prod * deltaSec),
        };
      });

      set({
        resources: {
          ...state.resources,
          linesOfCode: newLoC,
          totalLoCEarned: state.resources.totalLoCEarned + locGain,
          techDebt: newTD,
          totalTechDebtEarned: (state.resources.totalTechDebtEarned ?? 0) + Math.max(0, tdChange),
          peakTechDebt: Math.max(state.resources.peakTechDebt ?? 0, newTD),
        },
        buildings: updatedBuildings,
        stats: {
          ...state.stats,
          totalTimePlayed: state.stats.totalTimePlayed + deltaSec,
          highestLocPerSecond: Math.max(state.stats.highestLocPerSecond, locPerSecond),
        },
        lastTickTimestamp: Date.now(),
      });
    },

    buyBuilding: (buildingId: string, quantity: number = 1) => {
      const state = get();
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;

      const owned = state.buildings.find((b) => b.id === buildingId);
      const ownedCount = owned?.count ?? 0;

      const maxBuy = Math.max(0, GAME_CONFIG.buildings.maxCount - ownedCount);
      if (maxBuy <= 0) return false;
      const actualQty = Math.min(quantity, maxBuy);

      const costReduction = selectCostReduction(state);

      let totalCost = 0;
      for (let i = 0; i < actualQty; i++) {
        totalCost += Math.floor(calculateBuildingCost(def, ownedCount + i) * costReduction);
      }

      if (state.resources.linesOfCode < totalCost) return false;

      const newBuildings = state.buildings.map((b) => (b.id === buildingId ? { ...b, count: b.count + actualQty } : b));

      set({
        resources: {
          ...state.resources,
          linesOfCode: state.resources.linesOfCode - totalCost,
        },
        buildings: newBuildings,
      });
      return true;
    },

    buyUpgrade: (upgradeId: string) => {
      const state = get();
      const upgrade = UPGRADES.find((u) => u.id === upgradeId);
      if (!upgrade) return false;
      if (state.purchasedUpgrades.includes(upgradeId)) return false;
      if (state.resources.linesOfCode < upgrade.cost) return false;

      set({
        resources: {
          ...state.resources,
          linesOfCode: state.resources.linesOfCode - upgrade.cost,
        },
        purchasedUpgrades: [...state.purchasedUpgrades, upgradeId],
      });
      return true;
    },

    shipProduct: () => {
      const state = get();
      const threshold = getPrestigeThreshold(state.prestige.prestigeUpgrades);
      if (state.resources.totalLoCEarned < threshold) return;

      const repEarned = selectReputationOnPrestige(state);
      const runTime = state.stats.totalTimePlayed;

      const newPrestige = {
        ...state.prestige,
        reputationPoints: state.prestige.reputationPoints + repEarned,
        totalReputationEarned: state.prestige.totalReputationEarned + repEarned,
        timesShipped: state.prestige.timesShipped + 1,
        lifetimeLoCEarned: (state.prestige.lifetimeLoCEarned ?? 0) + state.resources.totalLoCEarned,
      };

      const newStats = {
        ...state.stats,
        fastestPrestige:
          state.stats.fastestPrestige === null ? runTime : Math.min(state.stats.fastestPrestige, runTime),
        totalTimePlayed: 0,
        startedAt: Date.now(),
      };

      const fresh = createInitialState(newPrestige, state.unlockedAchievements, newStats);
      set(fresh);
    },

    buyPrestigeUpgrade: (upgradeId: string) => {
      const state = get();
      const upgrade = PRESTIGE_UPGRADES.find((u) => u.id === upgradeId);
      if (!upgrade) return false;
      if (state.prestige.prestigeUpgrades.includes(upgradeId)) return false;
      if (state.prestige.reputationPoints < upgrade.cost) return false;

      set({
        prestige: {
          ...state.prestige,
          reputationPoints: state.prestige.reputationPoints - upgrade.cost,
          prestigeUpgrades: [...state.prestige.prestigeUpgrades, upgradeId],
        },
      });
      return true;
    },

    saveGame: () => {
      const state = get();
      saveToStorage(state);
      set({ lastSaveTimestamp: Date.now() });
    },

    loadGame: () => {
      const saved = loadFromStorage();
      if (!saved) return false;

      const now = Date.now();
      const elapsed = Math.min((now - saved.lastTickTimestamp) / 1000, GAME_CONFIG.offline.maxSeconds);
      const locPerSec = selectLocPerSecond(saved);
      const offlineEarned = Math.max(0, locPerSec * elapsed);

      // Ensure new buildings exist in save
      const existingIds = new Set(saved.buildings.map((b) => b.id));
      const missingBuildings = BUILDINGS.filter((b) => !existingIds.has(b.id)).map((b) => ({
        id: b.id,
        count: 0,
        totalProduced: 0,
      }));

      // Remove PM building if it exists in save
      const cleanedBuildings = [...saved.buildings, ...missingBuildings].filter((b) => b.id !== "product_manager");

      set({
        ...saved,
        resources: {
          ...saved.resources,
          linesOfCode: saved.resources.linesOfCode + offlineEarned,
          totalLoCEarned: saved.resources.totalLoCEarned + offlineEarned,
          techDebt: saved.resources.techDebt ?? 0,
          totalTechDebtEarned: saved.resources.totalTechDebtEarned ?? 0,
          peakTechDebt: saved.resources.peakTechDebt ?? 0,
        },
        buildings: cleanedBuildings,
        activeBuffs: saved.activeBuffs ?? [],
        hackCooldowns: saved.hackCooldowns ?? {},
        purchasedUpgrades: (saved.purchasedUpgrades ?? []).filter(
          (id) => !id.startsWith("pm_") && id !== "auto_pm_meetings",
        ),
        refactoringUntil: saved.refactoringUntil ?? 0,
        prestige: {
          ...saved.prestige,
          lifetimeLoCEarned: saved.prestige.lifetimeLoCEarned ?? 0,
        },
        lastTickTimestamp: now,
      });
      return true;
    },

    resetGame: () => {
      clearSave();
      set(createInitialState());
    },

    exportSave: () => {
      return doExport(get());
    },

    importSave: (data: string) => {
      const imported = doImport(data);
      if (!imported) return false;
      set(imported);
      return true;
    },

    unlockAchievement: (id: string) => {
      const state = get();
      if (state.unlockedAchievements.includes(id)) return;
      set({
        unlockedAchievements: [...state.unlockedAchievements, id],
      });
    },

    addBuff: (buff) => {
      const state = get();
      set({
        activeBuffs: [...state.activeBuffs, buff],
      });
    },

    cleanExpiredBuffs: () => {
      const now = Date.now();
      const state = get();
      const active = state.activeBuffs.filter((b) => b.expiresAt > now);
      if (active.length !== state.activeBuffs.length) {
        set({ activeBuffs: active });
      }
    },

    addLoC: (amount: number) => {
      const state = get();
      set({
        resources: {
          ...state.resources,
          linesOfCode: Math.max(0, state.resources.linesOfCode + amount),
          totalLoCEarned: state.resources.totalLoCEarned + Math.max(0, amount),
        },
      });
    },

    activateHack: (hackId: string) => {
      const state = get();
      const hack = HACKS.find((h) => h.id === hackId);
      if (!hack) return false;

      // Check cooldown
      const now = Date.now();
      if ((state.hackCooldowns[hackId] ?? 0) > now) return false;

      // Check unlock
      if (state.resources.totalLoCEarned < hack.unlockThreshold) return false;

      // Dynamic TD cost and threshold based on current production
      const locPerSec = selectLocPerSecond(state);
      const rawLocPerSec = Math.abs(locPerSec) + 1; // avoid zero
      const tdCost = rawLocPerSec * hack.techDebtCostSeconds;
      const maxTD = rawLocPerSec * hack.maxTechDebtSeconds;

      // Check TD threshold - must have low enough debt to use hacks
      if ((state.resources.techDebt ?? 0) > maxTD) return false;

      const newTD = (state.resources.techDebt ?? 0) + tdCost;

      // Apply effect
      if (hack.effect.kind === "loc_burst") {
        const burst = locPerSec * 120;
        set({
          resources: {
            ...state.resources,
            linesOfCode: state.resources.linesOfCode + burst,
            totalLoCEarned: state.resources.totalLoCEarned + burst,
            techDebt: newTD,
            peakTechDebt: Math.max(state.resources.peakTechDebt ?? 0, newTD),
          },
          hackCooldowns: {
            ...state.hackCooldowns,
            [hackId]: now + hack.cooldownSeconds * 1000,
          },
        });
      } else {
        // Duration buff
        const buffId = `hack_${hackId}_${now}`;
        const buff = {
          id: buffId,
          buffId: hackId,
          productionMultiplier: hack.effect.kind === "production_boost" ? hack.effect.multiplier : undefined,
          clickMultiplier: hack.effect.kind === "click_boost" ? hack.effect.multiplier : undefined,
          tdFreeze: hack.effect.kind === "td_freeze" ? true : undefined,
          bugImmunity: hack.effect.kind === "bug_immunity" ? true : undefined,
          expiresAt: now + hack.effect.durationSeconds * 1000,
        };
        set({
          resources: {
            ...state.resources,
            techDebt: newTD,
            peakTechDebt: Math.max(state.resources.peakTechDebt ?? 0, newTD),
          },
          activeBuffs: [...state.activeBuffs, buff],
          hackCooldowns: {
            ...state.hackCooldowns,
            [hackId]: now + hack.cooldownSeconds * 1000,
          },
        });
      }
      return true;
    },

    deductLoC: (amount: number) => {
      const state = get();
      set({
        resources: {
          ...state.resources,
          linesOfCode: Math.max(0, state.resources.linesOfCode - amount),
        },
      });
    },

    reduceTechDebt: (amount: number) => {
      const state = get();
      set({
        resources: {
          ...state.resources,
          techDebt: Math.max(0, (state.resources.techDebt ?? 0) - amount),
        },
      });
    },

    refactorDebt: () => {
      const state = get();
      const currentTD = state.resources.techDebt ?? 0;
      if (currentTD <= 0) return false;
      if ((state.refactoringUntil ?? 0) > Date.now()) return false;

      set({
        resources: {
          ...state.resources,
          techDebt: Math.max(0, currentTD * GAME_CONFIG.techDebt.refactorRetainPercent),
        },
        refactoringUntil: Date.now() + GAME_CONFIG.techDebt.refactorDurationMs,
      });
      return true;
    },
  })),
);
