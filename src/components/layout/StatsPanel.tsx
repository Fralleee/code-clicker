import { useGameStore } from "../../store/gameStore";
import {
  selectClickValue,
  selectLocPerSecond,
  selectPrestigeMultiplier,
  selectTotalBuildings,
} from "../../store/selectors";
import { formatNumber } from "../../utils/formatNumber";
import { AchievementList } from "../achievements/AchievementList";
import { HackPanel } from "../shop/HackPanel";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

interface StatsPanelProps {
  hideHacks?: boolean;
}

export function StatsPanel({ hideHacks = false }: StatsPanelProps) {
  const state = useGameStore.getState();
  const totalLoc = useGameStore((s) => s.resources.totalLoCEarned);
  const totalClicks = useGameStore((s) => s.resources.totalClicks);
  const timePlayed = useGameStore((s) => s.stats.totalTimePlayed);
  const timesShipped = useGameStore((s) => s.prestige.timesShipped);
  const reputation = useGameStore((s) => s.prestige.totalReputationEarned);

  const locPerSec = selectLocPerSecond(state);
  const clickValue = selectClickValue(state);
  const prestigeMult = selectPrestigeMultiplier(state);
  const totalBuildings = selectTotalBuildings(state);

  const hasHackAccess = state.prestige.prestigeUpgrades.includes("hack_access");
  const showHacks = hasHackAccess && !hideHacks;

  // Force re-render on tick
  useGameStore((s) => s.resources.linesOfCode);

  return (
    <div className="flex flex-col h-full p-3">
      {/* Stats - fixed at top */}
      <div className="shrink-0">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Stats</h3>
        <div className="space-y-1.5 text-xs">
          <StatRow label="Total LoC" value={formatNumber(totalLoc)} />
          <StatRow label="LoC/sec" value={formatNumber(locPerSec)} />
          <StatRow label="LoC/click" value={formatNumber(clickValue)} />
          <StatRow label="Total Clicks" value={formatNumber(totalClicks)} />
          <StatRow label="Buildings" value={totalBuildings.toString()} />
          <StatRow label="Time Played" value={formatTime(timePlayed)} />
          {timesShipped > 0 && (
            <>
              <div className="border-t border-white/5 pt-1.5 mt-1.5" />
              <StatRow label="Times Shipped" value={timesShipped.toString()} />
              <StatRow label="Reputation" value={formatNumber(reputation)} />
              <StatRow label="Prestige Bonus" value={`+${Math.round((prestigeMult - 1) * 100)}%`} />
            </>
          )}
        </div>
      </div>

      {/* Hacks - below stats (hidden in mobile Stats drawer since Hacks has its own tab) */}
      {showHacks && !hideHacks && (
        <div className="shrink-0 border-t border-white/5 pt-3 mt-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Hacks</h3>
          <HackPanel />
        </div>
      )}

      {/* Achievements - scrollable, fills remaining space */}
      <div className="border-t border-white/5 pt-3 mt-3 flex-1 min-h-0 overflow-y-auto">
        <AchievementList />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text-muted">{label}</span>
      <span className="font-mono text-text-primary">{value}</span>
    </div>
  );
}
