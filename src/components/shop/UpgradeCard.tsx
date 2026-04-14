import { useGameStore } from "../../store/gameStore";
import type { UpgradeDefinition } from "../../types/game";
import { formatNumber } from "../../utils/formatNumber";

interface Props {
  upgrade: UpgradeDefinition;
}

function effectLabel(upgrade: UpgradeDefinition): string {
  const e = upgrade.effect;
  switch (e.kind) {
    case "click_power":
      return `Click x${e.multiplier}`;
    case "building_boost":
      return `x${e.multiplier} production`;
    case "global_production":
      return `All x${e.multiplier}`;
    case "click_percent_of_cps":
      return `+${e.percent * 100}% CPS/click`;
    case "td_reduction":
      return `-${Math.round(e.reduction * 100)}% TD`;
  }
}

export function UpgradeCard({ upgrade }: Props) {
  const loc = useGameStore((s) => s.resources.linesOfCode);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const canAfford = loc >= upgrade.cost;

  return (
    <button
      type="button"
      onClick={() => buyUpgrade(upgrade.id)}
      disabled={!canAfford}
      title={upgrade.description}
      className={`p-3 rounded-lg border transition-all text-left ${
        canAfford
          ? "bg-bg-card hover:bg-bg-card-hover border-accent-purple/30 cursor-pointer hover:border-accent-purple/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          : "bg-bg-card/50 border-white/5 cursor-not-allowed opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{upgrade.icon}</span>
        <span className="font-semibold text-sm text-text-primary truncate">{upgrade.name}</span>
      </div>
      <div className="text-xs text-text-muted mb-2 line-clamp-2">{upgrade.description}</div>
      <div className="flex items-center justify-between">
        <span className={`font-mono text-xs ${canAfford ? "text-accent-green" : "text-accent-pink"}`}>
          {formatNumber(upgrade.cost)} LoC
        </span>
        <span className="text-xs text-accent-purple">{effectLabel(upgrade)}</span>
      </div>
    </button>
  );
}
