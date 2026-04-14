import { PRESTIGE_UPGRADES } from "../../data/prestige";
import { useGameStore } from "../../store/gameStore";
import { selectPrestigeMultiplier, selectReputationOnPrestige } from "../../store/selectors";
import { formatNumber } from "../../utils/formatNumber";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrestigeModal({ open, onClose }: Props) {
  const shipProduct = useGameStore((s) => s.shipProduct);
  const buyPrestigeUpgrade = useGameStore((s) => s.buyPrestigeUpgrade);
  const repPoints = useGameStore((s) => s.prestige.reputationPoints);
  const timesShipped = useGameStore((s) => s.prestige.timesShipped);
  const ownedPrestige = useGameStore((s) => s.prestige.prestigeUpgrades);

  const state = useGameStore.getState();
  const repOnPrestige = selectReputationOnPrestige(state);
  const prestigeMult = selectPrestigeMultiplier(state);

  if (!open) return null;

  const handleShip = () => {
    shipProduct();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-surface border border-accent-gold/20 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 animate-[bounce-in_0.3s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-accent-gold flex items-center gap-2">
            <span>📦</span> Ship the Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl cursor-pointer"
          >
            x
          </button>
        </div>

        <div className="space-y-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Times Shipped</span>
            <span className="font-mono text-text-primary">{timesShipped}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Current Reputation</span>
            <span className="font-mono text-accent-gold">{formatNumber(repPoints)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Prestige Bonus</span>
            <span className="font-mono text-accent-gold">+{Math.round((prestigeMult - 1) * 100)}%</span>
          </div>

          {repOnPrestige > 0 && (
            <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3">
              <div className="text-accent-gold font-semibold mb-1">
                Ship now for +{formatNumber(repOnPrestige)} reputation
              </div>
              <div className="text-xs text-text-muted">
                This will reset your LoC, buildings, and upgrades. Reputation and achievements are permanent.
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleShip}
          disabled={repOnPrestige === 0}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm mb-4 transition-all cursor-pointer ${
            repOnPrestige > 0
              ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30"
              : "bg-white/5 text-text-muted border border-white/5 cursor-not-allowed"
          }`}
        >
          Ship It! (+{formatNumber(repOnPrestige)} rep)
        </button>

        {/* Prestige upgrades */}
        <div className="border-t border-white/5 pt-4 flex-1 min-h-0 flex flex-col">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 shrink-0">
            Prestige Upgrades
          </h3>
          <div className="space-y-2 overflow-y-auto min-h-0 flex-1">
            {PRESTIGE_UPGRADES.map((pu) => {
              const owned = ownedPrestige.includes(pu.id);
              const canAfford = repPoints >= pu.cost && !owned;
              return (
                <button
                  key={pu.id}
                  type="button"
                  onClick={() => buyPrestigeUpgrade(pu.id)}
                  disabled={!canAfford}
                  className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all ${
                    owned
                      ? "bg-accent-gold/5 border-accent-gold/20 opacity-60"
                      : canAfford
                        ? "bg-bg-card hover:bg-bg-card-hover border-accent-gold/20 cursor-pointer"
                        : "bg-bg-card/50 border-white/5 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{pu.icon}</span>
                      <span className={owned ? "text-accent-gold" : "text-text-primary"}>{pu.name}</span>
                      {owned && <span className="text-xs text-accent-green">Owned</span>}
                    </span>
                    {!owned && <span className="font-mono text-xs text-accent-gold">{pu.cost} rep</span>}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">{pu.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
