export interface HackDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: {
    kind: "production_boost" | "click_boost" | "loc_burst" | "td_freeze" | "bug_immunity";
    multiplier?: number;
    durationSeconds: number;
  };
  techDebtCostSeconds: number;
  maxTechDebtSeconds: number;
  cooldownSeconds: number;
  unlockThreshold: number;
}

export const HACKS: HackDefinition[] = [
  {
    id: "spaghetti_sprint",
    name: "Spaghetti Sprint",
    description: "1.5x production for 45s. Adds 8s of TD.",
    icon: "🍝",
    effect: { kind: "production_boost", multiplier: 1.5, durationSeconds: 45 },
    techDebtCostSeconds: 8,
    maxTechDebtSeconds: 40,
    cooldownSeconds: 30,
    unlockThreshold: 1_000,
  },
  {
    id: "copy_paste_frenzy",
    name: "Copy-Paste Frenzy",
    description: "5x click power for 30s. Adds 5s of TD.",
    icon: "📋",
    effect: { kind: "click_boost", multiplier: 5, durationSeconds: 30 },
    techDebtCostSeconds: 5,
    maxTechDebtSeconds: 30,
    cooldownSeconds: 30,
    unlockThreshold: 5_000,
  },
  {
    id: "debt_freeze",
    name: "Code Freeze",
    description: "Tech Debt stops accumulating for 30s. Adds 3s of TD.",
    icon: "🧊",
    effect: { kind: "td_freeze", durationSeconds: 30 },
    techDebtCostSeconds: 3,
    maxTechDebtSeconds: 40,
    cooldownSeconds: 45,
    unlockThreshold: 10_000,
  },
  {
    id: "bug_shield",
    name: "Bug Shield",
    description: "No bugs spawn for 45s. Adds 5s of TD.",
    icon: "🛡️",
    effect: { kind: "bug_immunity", durationSeconds: 45 },
    techDebtCostSeconds: 5,
    maxTechDebtSeconds: 40,
    cooldownSeconds: 45,
    unlockThreshold: 25_000,
  },
  {
    id: "dependency_hell",
    name: "Dependency Hell",
    description: "Instant 30s of production. Adds 10s of TD.",
    icon: "📦",
    effect: { kind: "loc_burst", durationSeconds: 0 },
    techDebtCostSeconds: 10,
    maxTechDebtSeconds: 40,
    cooldownSeconds: 45,
    unlockThreshold: 50_000,
  },
];
