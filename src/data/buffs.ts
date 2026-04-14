export interface BuffDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "legendary";
  duration: number | null;
  apply: (ctx: BuffContext) => BuffResult;
}

export interface BuffContext {
  currentLoC: number;
  locPerSecond: number;
  clickValue: number;
}

export interface BuffResult {
  instantLoC?: number;
  productionMultiplier?: number;
  clickMultiplier?: number;
  duration?: number;
  message: string;
}

export const BUFFS: BuffDefinition[] = [
  {
    id: "code_frenzy",
    name: "Code Frenzy",
    description: "All production x1.5 for 30 seconds!",
    icon: "🔥",
    rarity: "common",
    duration: 30,
    apply: () => ({
      productionMultiplier: 1.5,
      duration: 30,
      message: "Code Frenzy! 1.5x production for 30s!",
    }),
  },
  {
    id: "click_storm",
    name: "Click Storm",
    description: "Click power x10 for 20 seconds!",
    icon: "⚡",
    rarity: "common",
    duration: 20,
    apply: () => ({
      clickMultiplier: 10,
      duration: 20,
      message: "Click Storm! 10x click power for 20s!",
    }),
  },
  {
    id: "lucky_commit",
    name: "Lucky Commit",
    description: "Instantly gain 30 seconds of production!",
    icon: "🍀",
    rarity: "rare",
    duration: null,
    apply: (ctx) => ({
      instantLoC: ctx.locPerSecond * 30,
      message: `Lucky Commit! +${formatBig(ctx.locPerSecond * 30)} LoC!`,
    }),
  },
  {
    id: "hackathon",
    name: "Hackathon Weekend",
    description: "All production x1.25 for 60 seconds!",
    icon: "💻",
    rarity: "rare",
    duration: 60,
    apply: () => ({
      productionMultiplier: 1.25,
      duration: 60,
      message: "Hackathon! 1.25x production for 60s!",
    }),
  },
  {
    id: "merge_party",
    name: "Merge Party",
    description: "Gain 2 minutes of production instantly!",
    icon: "🎉",
    rarity: "legendary",
    duration: null,
    apply: (ctx) => ({
      instantLoC: ctx.locPerSecond * 120,
      message: `Merge Party! +${formatBig(ctx.locPerSecond * 120)} LoC!`,
    }),
  },
];

function formatBig(n: number): string {
  if (n < 10_000) return Math.floor(n).toLocaleString();
  const suffixes = ["", "K", "M", "B", "T"];
  const tier = Math.min(Math.floor(Math.log10(n) / 3), suffixes.length - 1);
  const scaled = n / 10 ** (tier * 3);
  return `${scaled.toFixed(1)}${suffixes[tier]}`;
}

export function pickRandomBuff(): BuffDefinition {
  const weights: Record<string, number> = {
    common: 50,
    rare: 35,
    legendary: 15,
  };
  const weighted = BUFFS.flatMap((b) => Array(weights[b.rarity] ?? 1).fill(b));
  return weighted[Math.floor(Math.random() * weighted.length)];
}
