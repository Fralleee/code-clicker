// === Core Resource Types ===
export interface GameResources {
  linesOfCode: number;
  totalLoCEarned: number;
  totalClicks: number;
  totalLoCFromClicks: number;
  techDebt: number;
  totalTechDebtEarned: number;
  peakTechDebt: number;
}

// === Buildings ===
export interface BuildingDefinition {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  baseProduction: number;
  unlockThreshold: number;
  icon: string;
  techDebtRatio: number;
}

export interface OwnedBuilding {
  id: string;
  count: number;
  totalProduced: number;
}

// === Upgrades ===
export type UpgradeEffect =
  | { kind: "click_power"; multiplier: number }
  | { kind: "building_boost"; buildingId: string; multiplier: number }
  | { kind: "global_production"; multiplier: number }
  | { kind: "click_percent_of_cps"; percent: number }
  | { kind: "td_reduction"; buildingId: string; reduction: number };

export type UpgradeUnlockCondition =
  | { kind: "total_loc"; amount: number }
  | { kind: "building_count"; buildingId: string; count: number }
  | { kind: "prestige_level"; level: number }
  | { kind: "total_clicks"; count: number };

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlockCondition: UpgradeUnlockCondition;
  effect: UpgradeEffect;
  icon: string;
  tier: number;
}

// === Achievements ===
export type AchievementCondition =
  | { kind: "total_loc"; amount: number }
  | { kind: "total_clicks"; count: number }
  | { kind: "building_count"; buildingId: string; count: number }
  | { kind: "total_buildings"; count: number }
  | { kind: "loc_per_second"; amount: number }
  | { kind: "prestige_count"; count: number }
  | { kind: "reputation_points"; amount: number };

export interface AchievementReward {
  kind: "production_bonus" | "click_bonus";
  multiplier: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "clicking" | "production" | "building" | "prestige" | "misc";
  condition: AchievementCondition;
  reward?: AchievementReward;
}

// === Prestige ===
export interface PrestigeUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  effect: string;
}

export interface PrestigeState {
  reputationPoints: number;
  totalReputationEarned: number;
  timesShipped: number;
  prestigeUpgrades: string[];
  lifetimeLoCEarned: number;
}

// === Active Buffs ===
export interface ActiveBuff {
  id: string;
  buffId: string;
  productionMultiplier?: number;
  clickMultiplier?: number;
  tdFreeze?: boolean;
  bugImmunity?: boolean;
  expiresAt: number;
}

// === Settings & Stats ===
export interface GameSettings {
  autoSaveEnabled: boolean;
  particlesEnabled: boolean;
}

export interface GameStats {
  totalTimePlayed: number;
  fastestPrestige: number | null;
  highestLocPerSecond: number;
  highestSingleClick: number;
  startedAt: number;
}

// === Root Game State ===
export interface GameState {
  resources: GameResources;
  buildings: OwnedBuilding[];
  purchasedUpgrades: string[];
  unlockedAchievements: string[];
  activeBuffs: ActiveBuff[];
  hackCooldowns: Record<string, number>;
  prestige: PrestigeState;
  settings: GameSettings;
  stats: GameStats;
  refactoringUntil: number;
  lastSaveTimestamp: number;
  lastTickTimestamp: number;
  gameVersion: string;
}

// === Store (state + actions) ===
export interface GameStore extends GameState {
  click: () => number;
  tick: (deltaMs: number) => void;
  buyBuilding: (buildingId: string, quantity?: number) => boolean;
  buyUpgrade: (upgradeId: string) => boolean;
  shipProduct: () => void;
  buyPrestigeUpgrade: (upgradeId: string) => boolean;
  saveGame: () => void;
  loadGame: () => boolean;
  resetGame: () => void;
  exportSave: () => string;
  importSave: (data: string) => boolean;
  unlockAchievement: (id: string) => void;
  addBuff: (buff: ActiveBuff) => void;
  cleanExpiredBuffs: () => void;
  addLoC: (amount: number) => void;
  activateHack: (hackId: string) => boolean;
  deductLoC: (amount: number) => void;
  reduceTechDebt: (amount: number) => void;
  refactorDebt: () => boolean;
}

// === UI Types ===
export type BuyQuantity = 1 | 10 | 100 | "max";

export type ShopTab = "buildings" | "upgrades" | "hacks";
