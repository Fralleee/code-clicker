import { BUILDINGS } from "../../data/buildings";
import { UPGRADES } from "../../data/upgrades";
import { useGameStore } from "../../store/gameStore";
import { selectLocPerSecond, selectTotalBuildings } from "../../store/selectors";
import { formatNumber } from "../../utils/formatNumber";

interface Props {
  open: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function VictoryModal({ open, onClose }: Props) {
  const state = useGameStore.getState();
  const resources = useGameStore((s) => s.resources);
  const stats = useGameStore((s) => s.stats);
  const prestige = useGameStore((s) => s.prestige);
  const buildings = useGameStore((s) => s.buildings);
  const purchasedUpgrades = useGameStore((s) => s.purchasedUpgrades);
  const achievements = useGameStore((s) => s.unlockedAchievements);

  const locPerSec = selectLocPerSecond(state);
  const totalBuildings = selectTotalBuildings(state);
  const totalUpgrades = purchasedUpgrades.length;
  const maxUpgrades = UPGRADES.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-bg-surface border border-accent-gold/30 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-[bounce-in_0.5s_ease-out]">
        {/* Header with confetti-style decoration */}
        <div className="relative bg-gradient-to-b from-accent-gold/10 to-transparent px-8 pt-8 pb-4 text-center">
          {/* Decorative elements */}
          <div className="absolute top-4 left-6 text-3xl animate-[bob_2s_ease-in-out_infinite]">🎉</div>
          <div
            className="absolute top-6 right-6 text-2xl animate-[bob_2.5s_ease-in-out_infinite]"
            style={{ animationDelay: "0.5s" }}
          >
            🏆
          </div>
          <div
            className="absolute top-3 left-1/4 text-xl animate-[bob_1.8s_ease-in-out_infinite]"
            style={{ animationDelay: "0.3s" }}
          >
            ⭐
          </div>
          <div
            className="absolute top-5 right-1/4 text-xl animate-[bob_2.2s_ease-in-out_infinite]"
            style={{ animationDelay: "0.7s" }}
          >
            🚀
          </div>

          <div className="text-5xl mb-3">👑</div>
          <h1 className="text-2xl font-bold text-accent-gold mb-1">You Did It!</h1>
          <p className="text-sm text-text-secondary">
            Every building built. Every upgrade purchased.
            <br />
            You are the ultimate 10x engineer.
          </p>
        </div>

        {/* Stats grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Final Stats</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Total LoC Written" value={formatNumber(resources.totalLoCEarned)} icon="📝" />
            <StatCard label="Current LoC/sec" value={formatNumber(locPerSec)} icon="⚡" />
            <StatCard label="Total Clicks" value={formatNumber(resources.totalClicks)} icon="👆" />
            <StatCard label="Highest Single Click" value={formatNumber(stats.highestSingleClick)} icon="💥" />
            <StatCard label="Peak LoC/sec" value={formatNumber(stats.highestLocPerSecond)} icon="📈" />
            <StatCard label="Total Time Played" value={formatTime(stats.totalTimePlayed)} icon="⏱️" />
            <StatCard label="Times Shipped" value={prestige.timesShipped.toString()} icon="📦" />
            <StatCard label="Total Reputation" value={formatNumber(prestige.totalReputationEarned)} icon="⭐" />
            <StatCard label="Buildings Owned" value={totalBuildings.toString()} icon="🏗️" />
            <StatCard label="Upgrades Purchased" value={`${totalUpgrades}/${maxUpgrades}`} icon="⬆️" />
            <StatCard label="Achievements" value={achievements.length.toString()} icon="🏆" />
            <StatCard label="Peak Tech Debt" value={formatNumber(resources.peakTechDebt)} icon="💳" />
          </div>

          {/* Building roster */}
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Your Team</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {BUILDINGS.map((def) => {
              const owned = buildings.find((b) => b.id === def.id);
              return (
                <div key={def.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-bg-card/50 text-xs">
                  <span>{def.icon}</span>
                  <span className="text-text-secondary truncate flex-1">{def.name}</span>
                  <span className="font-mono text-accent-cyan">{owned?.count ?? 0}</span>
                </div>
              );
            })}
          </div>

          {/* Fun flavor text */}
          <div className="text-center py-4 border-t border-white/5">
            <p className="text-sm text-text-muted italic">
              "Any sufficiently advanced codebase is indistinguishable from magic."
            </p>
            <p className="text-xs text-text-muted mt-2">
              You wrote {formatNumber(resources.totalLoCEarned)} lines of code.
              <br />
              That's roughly {formatNumber(resources.totalLoCEarned / 50)} novels worth of text.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-text-muted">CodeClicker - You beat the game! 🎮</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold/30 cursor-pointer transition-colors"
          >
            Keep Playing
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="p-3 rounded-lg bg-bg-card/60 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-mono text-sm text-text-primary font-semibold">{value}</div>
    </div>
  );
}
