import { computeCleanerBonus, computeTdReduction } from "../../engine/techDebt";
import { useGameStore } from "../../store/gameStore";
import {
  getPurchasedSet,
  selectBuildingMastery,
  selectBuildingMultiplier,
  selectBuildingProduction,
  selectCostReduction,
} from "../../store/selectors";
import type { BuildingDefinition, BuyQuantity } from "../../types/game";
import { calculateBuildingCost, MAX_BUILDING_COUNT, resolveQuantity } from "../../utils/calculations";
import { formatNumber } from "../../utils/formatNumber";

interface Props {
  building: BuildingDefinition;
  buyQuantity: BuyQuantity;
}

export function BuildingCard({ building, buyQuantity }: Props) {
  const loc = useGameStore((s) => s.resources.linesOfCode);
  const owned = useGameStore((s) => s.buildings.find((b) => b.id === building.id)?.count ?? 0);
  const buyBuilding = useGameStore((s) => s.buyBuilding);
  const state = useGameStore.getState();

  const costReduction = selectCostReduction(state);
  const qty = resolveQuantity(buyQuantity, building, owned, loc);
  const totalProduction = selectBuildingProduction(state, building.id);
  const buildingMult = selectBuildingMultiplier(state, building.id);
  const purchased = getPurchasedSet(state);
  const tdModifier =
    building.techDebtRatio > 0
      ? computeTdReduction(building.id, purchased)
      : computeCleanerBonus(building.id, building.techDebtRatio, purchased);
  const eachTD = building.baseProduction * building.techDebtRatio * buildingMult * tdModifier;
  const isMastered = selectBuildingMastery(state, building.id);
  const isMaxCount = owned >= MAX_BUILDING_COUNT;

  // When qty is 0 (can't afford any with Max), show cost of 1
  const displayQty = qty > 0 ? qty : 1;
  let totalCost = 0;
  if (!isMaxCount) {
    for (let i = 0; i < displayQty; i++) {
      totalCost += Math.floor(calculateBuildingCost(building, owned + i) * costReduction);
    }
  }

  const canAfford = loc >= totalCost && qty > 0 && !isMaxCount;

  const handleBuy = () => {
    if (qty > 0 && !isMaxCount) buyBuilding(building.id, qty);
  };

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={!canAfford}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isMastered
          ? "bg-accent-green/5 border-accent-green/30"
          : canAfford
            ? "bg-bg-card hover:bg-bg-card-hover border-accent-cyan/20 cursor-pointer hover:border-accent-cyan/40"
            : "bg-bg-card/50 border-white/5 cursor-not-allowed opacity-60"
      }`}
    >
      {/* Top row: icon + name + description */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <span className="text-2xl">{building.icon}</span>
          {isMastered && (
            <span className="absolute -top-1 -right-2 px-1 py-0.5 rounded text-[8px] font-black bg-accent-green text-bg-deep leading-none">
              10x
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-primary text-sm truncate">{building.name}</span>
            <span className={`font-mono text-xs shrink-0 ${isMaxCount ? "text-accent-gold" : "text-text-secondary"}`}>
              {isMaxCount ? "MAX" : `x${owned}`}
            </span>
          </div>
          <div className="text-xs text-text-muted truncate">{building.description}</div>
        </div>
      </div>
      {/* Bottom row: colored stats — full width */}
      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/5">
        {isMaxCount ? (
          <span className="text-xs text-accent-gold font-semibold">
            {isMastered ? "Mastered!" : `${owned}/${MAX_BUILDING_COUNT}`}
          </span>
        ) : (
          <span className={`font-mono text-xs ${canAfford ? "text-accent-green" : "text-accent-pink"}`}>
            {displayQty > 1 ? `${displayQty}x ` : ""}
            {formatNumber(totalCost)} LoC
          </span>
        )}
        <div className="flex items-center gap-3">
          {totalProduction > 0 && <span className="text-xs text-accent-cyan">{formatNumber(totalProduction)}/s</span>}
          {owned > 0 && eachTD !== 0 && (
            <span className={`text-xs whitespace-nowrap ${eachTD > 0 ? "text-accent-pink" : "text-accent-green"}`}>
              {eachTD > 0 ? "+" : ""}
              {formatNumber(eachTD * owned)}/s TD
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
