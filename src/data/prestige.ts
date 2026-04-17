import { GAME_CONFIG } from "../config/gameConfig";
import type { PrestigeUpgradeDefinition } from "../types/game";

export const PRESTIGE_UPGRADES: PrestigeUpgradeDefinition[] = [
  // Tier 1 — First prestiges (10-100 rep)
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
  {
    id: "clean_codebase",
    name: "Clean Codebase",
    description: "50% less Tech Debt generation for the first 60 seconds of each run",
    cost: 100,
    icon: "✨",
    effect: "clean_start",
  },

  // Tier 2 — Growing reputation (250-1K rep)
  {
    id: "angel_investor",
    name: "Angel Investor",
    description: "+10% to all production permanently (stacks with multiple purchases)",
    cost: 250,
    icon: "💰",
    effect: "angel_investor",
  },
  {
    id: "venture_capital",
    name: "Venture Capital",
    description: "Start each run with 10,000 LoC",
    cost: 500,
    icon: "🏦",
    effect: "start_loc_large",
  },
  {
    id: "serial_entrepreneur",
    name: "Serial Entrepreneur",
    description: "Reputation earned +50%",
    cost: 1_000,
    icon: "🎯",
    effect: "reputation_boost",
  },

  // Tier 3 — Mid-game grinders (2.5K-10K rep)
  {
    id: "senior_network",
    name: "Senior Network",
    description: "Start each run with 1 free Senior Developer",
    cost: 2_500,
    icon: "🤝",
    effect: "free_senior",
  },
  {
    id: "hack_access",
    name: "Hacker Mindset",
    description: "Unlock Hacks — temporary boosts that add Tech Debt",
    cost: 5_000,
    icon: "🍝",
    effect: "hack_access",
  },
  {
    id: "scaling_expert",
    name: "Scaling Expert",
    description: "+25% to all production permanently",
    cost: 5_000,
    icon: "📈",
    effect: "production_boost",
  },
  {
    id: "tech_empire",
    name: "Tech Empire",
    description: "Prestige threshold reduced to 500,000 LoC (from 1,000,000)",
    cost: 10_000,
    icon: "👑",
    effect: "lower_prestige_threshold",
  },

  // Tier 4 — Dedicated players (25K-250K rep)
  {
    id: "code_legacy",
    name: "Code Legacy",
    description: "Start each run with 100,000 LoC",
    cost: 25_000,
    icon: "🏛️",
    effect: "start_loc_huge",
  },
  {
    id: "devops_pipeline",
    name: "DevOps Pipeline",
    description: "Start each run with 1 free DevOps Engineer",
    cost: 50_000,
    icon: "🔧",
    effect: "free_devops",
  },
  {
    id: "double_down",
    name: "Double Down",
    description: "+50% to all production permanently",
    cost: 100_000,
    icon: "⚡",
    effect: "production_boost_large",
  },
  {
    id: "mass_hiring",
    name: "Mass Hiring",
    description: "Start each run with 5 of every building up to Senior Dev",
    cost: 250_000,
    icon: "🏢",
    effect: "mass_hiring",
  },

  // Tier 5 — Endgame prestige (1M-5M rep)
  {
    id: "reputation_machine",
    name: "Reputation Machine",
    description: "Reputation earned doubled",
    cost: 1_000_000,
    icon: "🌟",
    effect: "reputation_double",
  },
  {
    id: "eternal_coder",
    name: "Eternal Coder",
    description: "Permanent 5x click power across all runs",
    cost: 5_000_000,
    icon: "💎",
    effect: "click_power_large",
  },

  // Tier 6 — Lategame (25M-500M rep)
  {
    id: "improved_refactor",
    name: "Improved Refactor",
    description: "Refactor removes 90% of Tech Debt (up from 70%)",
    cost: 25_000_000,
    icon: "🔬",
    effect: "improved_refactor",
  },
  {
    id: "exponential_growth",
    name: "Exponential Growth",
    description: "+200% to all production permanently",
    cost: 100_000_000,
    icon: "🚀",
    effect: "exponential_growth",
  },
  {
    id: "time_warp",
    name: "Time Warp",
    description: "Offline progress cap increased to 24 hours (from 8)",
    cost: 500_000_000,
    icon: "⏰",
    effect: "time_warp",
  },

  // Tier 7 — Deep endgame (5B-250B rep)
  {
    id: "mega_hiring",
    name: "Mega Hiring",
    description: "Start each run with 10 of every building",
    cost: 5_000_000_000,
    icon: "🏗️",
    effect: "mega_hiring",
  },
  {
    id: "buff_mastery",
    name: "Buff Mastery",
    description: "All buff durations doubled",
    cost: 50_000_000_000,
    icon: "🧪",
    effect: "buff_mastery",
  },
  {
    id: "instant_empire",
    name: "Instant Empire",
    description: "Prestige threshold reduced to 100,000 LoC",
    cost: 250_000_000_000,
    icon: "⚡",
    effect: "instant_empire",
  },

  // Tier 8 — Capstone (1T rep)
  {
    id: "transcendence",
    name: "Transcendence",
    description: "Permanent 100x click power. You have become one with the code.",
    cost: 1_000_000_000_000,
    icon: "🌌",
    effect: "transcendence",
  },
];

export const BASE_PRESTIGE_THRESHOLD = GAME_CONFIG.prestige.baseThreshold;

export function getPrestigeThreshold(prestigeUpgrades: string[]): number {
  if (prestigeUpgrades.includes("instant_empire")) return GAME_CONFIG.prestige.instantEmpireThreshold;
  if (prestigeUpgrades.includes("tech_empire")) return GAME_CONFIG.prestige.reducedThreshold;
  return BASE_PRESTIGE_THRESHOLD;
}

export function calculateReputationEarned(totalLoCEarned: number, hasReputationBoost: boolean): number {
  const ratio = Math.max(1, totalLoCEarned / BASE_PRESTIGE_THRESHOLD);
  const base = Math.floor(Math.log2(ratio) * 1.5) + 1;
  return hasReputationBoost ? Math.floor(base * 1.5) : base;
}
