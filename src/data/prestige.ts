import type { PrestigeUpgradeDefinition } from "../types/game";

export const PRESTIGE_UPGRADES: PrestigeUpgradeDefinition[] = [
  // Tier 1 - Early prestige (first few prestiges)
  {
    id: "head_start",
    name: "Head Start",
    description: "Start each run with 1,000 LoC",
    cost: 10,
    icon: "🏁",
    effect: "start_loc",
  },
  {
    id: "better_interviews",
    name: "Better Interviews",
    description: "All buildings cost 5% less",
    cost: 25,
    icon: "📋",
    effect: "cost_reduction",
  },
  {
    id: "click_mastery",
    name: "Click Mastery",
    description: "Permanent 2x click power across all runs",
    cost: 50,
    icon: "👆",
    effect: "click_power",
  },

  // Tier 2 - Several prestiges in
  {
    id: "clean_codebase",
    name: "Clean Codebase",
    description: "50% less Tech Debt generation for the first 60 seconds of each run",
    cost: 100,
    icon: "✨",
    effect: "clean_start",
  },
  {
    id: "angel_investor",
    name: "Angel Investor",
    description: "+10% to all production permanently (stacks with multiple purchases)",
    cost: 150,
    icon: "💰",
    effect: "angel_investor",
  },
  {
    id: "venture_capital",
    name: "Venture Capital",
    description: "Start each run with 10,000 LoC",
    cost: 250,
    icon: "🏦",
    effect: "start_loc_large",
  },

  // Tier 3 - Dedicated prestige grinders
  {
    id: "serial_entrepreneur",
    name: "Serial Entrepreneur",
    description: "Reputation earned +50%",
    cost: 500,
    icon: "🎯",
    effect: "reputation_boost",
  },
  {
    id: "senior_network",
    name: "Senior Network",
    description: "Start each run with 1 free Senior Developer",
    cost: 750,
    icon: "🤝",
    effect: "free_senior",
  },
  {
    id: "scaling_expert",
    name: "Scaling Expert",
    description: "+25% to all production permanently",
    cost: 1_000,
    icon: "📈",
    effect: "production_boost",
  },

  // Tier 4 - Long-term goals
  {
    id: "tech_empire",
    name: "Tech Empire",
    description: "Prestige threshold reduced to 500,000 LoC (from 1,000,000)",
    cost: 2_000,
    icon: "👑",
    effect: "lower_prestige_threshold",
  },
  {
    id: "code_legacy",
    name: "Code Legacy",
    description: "Start each run with 100,000 LoC",
    cost: 3_000,
    icon: "🏛️",
    effect: "start_loc_huge",
  },
  {
    id: "devops_pipeline",
    name: "DevOps Pipeline",
    description: "Start each run with 1 free DevOps Engineer",
    cost: 5_000,
    icon: "🔧",
    effect: "free_devops",
  },
  {
    id: "double_down",
    name: "Double Down",
    description: "+50% to all production permanently",
    cost: 7_500,
    icon: "⚡",
    effect: "production_boost_large",
  },

  // Tier 5 - Endgame prestige
  {
    id: "mass_hiring",
    name: "Mass Hiring",
    description: "Start each run with 5 of every building up to Senior Dev",
    cost: 15_000,
    icon: "🏢",
    effect: "mass_hiring",
  },
  {
    id: "reputation_machine",
    name: "Reputation Machine",
    description: "Reputation earned doubled",
    cost: 25_000,
    icon: "🌟",
    effect: "reputation_double",
  },
  {
    id: "eternal_coder",
    name: "Eternal Coder",
    description: "Permanent 5x click power across all runs",
    cost: 50_000,
    icon: "💎",
    effect: "click_power_large",
  },
];

export const BASE_PRESTIGE_THRESHOLD = 1_000_000;

export function getPrestigeThreshold(prestigeUpgrades: string[]): number {
  return prestigeUpgrades.includes("tech_empire") ? 500_000 : BASE_PRESTIGE_THRESHOLD;
}

export function calculateReputationEarned(totalLoCEarned: number, hasReputationBoost: boolean): number {
  // Logarithmic scaling: each doubling of LoC adds ~1.5 rep
  // 1M=1, 8M=5, 64M=10, 500M=14, 5B=19, 50B=24, 500B=29
  const ratio = Math.max(1, totalLoCEarned / BASE_PRESTIGE_THRESHOLD);
  const base = Math.floor(Math.log2(ratio) * 1.5) + 1;
  return hasReputationBoost ? Math.floor(base * 1.5) : base;
}
