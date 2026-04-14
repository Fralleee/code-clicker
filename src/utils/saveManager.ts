import type { GameState } from "../types/game";

const SAVE_KEY = "codeclicker_save";
const SAVE_VERSION = 5;

interface SaveData {
  version: number;
  timestamp: number;
  state: GameState;
}

function migrateV1toV2(state: GameState): GameState {
  return {
    ...state,
    prestige: {
      ...state.prestige,
      lifetimeLoCEarned: state.prestige.lifetimeLoCEarned ?? state.resources.totalLoCEarned,
    },
    activeBuffs: state.activeBuffs ?? [],
  };
}

function migrateV2toV3(state: GameState): GameState {
  return {
    ...state,
    resources: {
      ...state.resources,
      techDebt: state.resources.techDebt ?? 0,
      totalTechDebtEarned: state.resources.totalTechDebtEarned ?? 0,
      peakTechDebt: state.resources.peakTechDebt ?? 0,
    },
  };
}

function migrateV3toV4(state: GameState): GameState {
  return {
    ...state,
    hackCooldowns: {},
    purchasedUpgrades: (state.purchasedUpgrades ?? []).filter(
      (id) => !id.startsWith("pm_") && id !== "auto_pm_meetings",
    ),
    buildings: (state.buildings ?? []).filter((b) => b.id !== "product_manager"),
  };
}

function migrateV4toV5(state: GameState): GameState {
  // Remove autoBuildTimers and old upgrade IDs
  const s = state as unknown as Record<string, unknown>;
  if (s.autoBuildTimers) delete s.autoBuildTimers;
  return state;
}

function migrateState(data: { version: number; state: GameState }): GameState {
  let state = data.state;
  if (data.version <= 1) {
    state = migrateV1toV2(state);
  }
  if (data.version <= 2) {
    state = migrateV2toV3(state);
  }
  if (data.version <= 3) {
    state = migrateV3toV4(state);
  }
  if (data.version <= 4) {
    state = migrateV4toV5(state);
  }
  return state;
}

export function saveToStorage(state: GameState): void {
  const data: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    state: { ...state, lastSaveTimestamp: Date.now() },
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version === SAVE_VERSION) return data.state;
    if (data.version < SAVE_VERSION) return migrateState(data);
    return null;
  } catch {
    return null;
  }
}

export function exportSave(state: GameState): string {
  const data: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    state,
  };
  return btoa(JSON.stringify(data));
}

export function importSave(encoded: string): GameState | null {
  try {
    const raw = atob(encoded);
    const data = JSON.parse(raw) as SaveData;
    if (data.version === SAVE_VERSION) return data.state;
    if (data.version < SAVE_VERSION) return migrateState(data);
    return null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
