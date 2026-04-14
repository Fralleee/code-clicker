import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import {
  selectVisibleBuildings,
  selectVisibleUpgrades,
} from "../../store/selectors";
import type { BuyQuantity } from "../../types/game";
import { formatNumber } from "../../utils/formatNumber";
import { BuildingCard } from "./BuildingCard";
import { UpgradeCard } from "./UpgradeCard";

const BUY_QUANTITIES: BuyQuantity[] = [1, 10, 100, "max"];

function MysteryBuildingCard({ cost }: { cost: number }) {
  return (
    <div className="w-full p-3 rounded-lg border border-white/5 bg-bg-card/30 opacity-50">
      <div className="flex items-center gap-3">
        <span className="text-2xl grayscale opacity-50">???</span>
        <div className="flex-1">
          <div className="font-semibold text-text-muted text-sm">???</div>
          <div className="text-xs text-text-muted/60 italic">
            Keep coding to discover...
          </div>
          <div className="font-mono text-xs text-text-muted mt-1">
            {formatNumber(cost)} LoC
          </div>
        </div>
      </div>
    </div>
  );
}

type Tab = "buildings" | "upgrades";

export function ShopPanel() {
  const [tab, setTab] = useState<Tab>("buildings");
  const [buyQty, setBuyQty] = useState<BuyQuantity>(1);

  const state = useGameStore.getState();
  const buildings = selectVisibleBuildings(state);
  const upgrades = selectVisibleUpgrades(state);

  // Force re-render on relevant state changes
  useGameStore((s) => s.resources.linesOfCode);
  useGameStore((s) => s.resources.techDebt);
  useGameStore((s) => s.buildings);
  useGameStore((s) => s.purchasedUpgrades);

  return (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="flex items-center gap-1 p-2 border-b border-white/5">
        <button
          type="button"
          onClick={() => setTab("buildings")}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
            tab === "buildings"
              ? "bg-accent-cyan/15 text-accent-cyan"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Buildings
        </button>
        <button
          type="button"
          onClick={() => setTab("upgrades")}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
            tab === "upgrades"
              ? "bg-accent-purple/15 text-accent-purple"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Upgrades
          {upgrades.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-purple/20 text-[10px]">
              {upgrades.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {tab === "buildings" && (
          <>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-text-muted mr-1">Buy:</span>
              {BUY_QUANTITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setBuyQty(q)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                    buyQty === q
                      ? "bg-accent-cyan/20 text-accent-cyan"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {q === "max" ? "Max" : `x${q}`}
                </button>
              ))}
            </div>

            {buildings.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-8">
                Click to earn your first lines of code!
              </div>
            ) : (
              buildings.map((vb) =>
                vb.visibility === "mystery" ? (
                  <MysteryBuildingCard
                    key={vb.building.id}
                    cost={vb.building.baseCost}
                  />
                ) : (
                  <BuildingCard
                    key={vb.building.id}
                    building={vb.building}
                    buyQuantity={buyQty}
                  />
                ),
              )
            )}
          </>
        )}

        {tab === "upgrades" &&
          (upgrades.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-8">
              Keep coding to unlock upgrades...
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={!upgrades.some(
                  (u) => useGameStore.getState().resources.linesOfCode >= u.cost,
                )}
                onClick={() => {
                  let bought = true;
                  while (bought) {
                    bought = false;
                    const s = useGameStore.getState();
                    const visible = selectVisibleUpgrades(s);
                    const sorted = [...visible].sort((a, b) => a.cost - b.cost);
                    for (const upgrade of sorted) {
                      if (s.resources.linesOfCode >= upgrade.cost) {
                        useGameStore.getState().buyUpgrade(upgrade.id);
                        bought = true;
                        break;
                      }
                    }
                  }
                }}
                className="w-full mb-2 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy All Affordable
              </button>
              <div className="grid grid-cols-1 gap-2">
                {upgrades.map((u) => (
                  <UpgradeCard key={u.id} upgrade={u} />
                ))}
              </div>
            </>
          ))}
      </div>
    </div>
  );
}
