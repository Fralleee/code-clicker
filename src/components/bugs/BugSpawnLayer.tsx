import { useCallback, useEffect, useState } from "react";
import type { BugDefinition } from "../../data/bugs";
import { getBugSpawnInterval, getMaxActiveBugs, pickRandomBug } from "../../data/bugs";
import type { SpawnedItem } from "../../hooks/useSpawnSystem";
import { useSpawnSystem } from "../../hooks/useSpawnSystem";
import { useGameStore } from "../../store/gameStore";
import { selectIsBugImmune, selectLocPerSecond, selectRawLocPerSecond } from "../../store/selectors";

interface BugMessage {
  key: number;
  message: string;
  isPositive: boolean;
}

let msgKey = 0;

export function BugSpawnLayer() {
  const [messages, setMessages] = useState<BugMessage[]>([]);
  const td = useGameStore((s) => s.resources.techDebt);

  const onExpire = useCallback((item: SpawnedItem<BugDefinition>) => {
    applyMissPenalty(item, setMessages);
  }, []);

  const { items, removeItem } = useSpawnSystem<BugDefinition>(
    {
      getInterval: () => {
        const state = useGameStore.getState();
        const rawLoC = selectRawLocPerSecond(state);
        const currentTd = state.resources.techDebt ?? 0;
        return getBugSpawnInterval(rawLoC, currentTd);
      },
      canSpawn: (current) => {
        const state = useGameStore.getState();
        if (selectIsBugImmune(state)) return false;
        const rawLoC = selectRawLocPerSecond(state);
        const currentTd = state.resources.techDebt ?? 0;
        return current.length < getMaxActiveBugs(rawLoC, currentTd);
      },
      createItem: () => {
        const state = useGameStore.getState();
        const rawLoC = selectRawLocPerSecond(state);
        const currentTd = state.resources.techDebt ?? 0;
        return pickRandomBug(rawLoC, currentTd);
      },
      getLifetime: (bug) => bug.lifetimeMs,
      onExpire,
      padding: 80,
      paddingTop: 120,
      paddingBottom: 80,
    },
    td,
  );

  const handleFix = useCallback(
    (target: SpawnedItem<BugDefinition>) => {
      const state = useGameStore.getState();
      const locPerSec = selectLocPerSecond(state);

      const reward = Math.max(0, locPerSec * target.data.fixRewardSeconds);
      if (reward > 0) state.addLoC(reward);

      const tdReduction = Math.max(5, (state.resources.techDebt ?? 0) * target.data.fixTdReductionPercent);
      state.reduceTechDebt(tdReduction);

      const key = msgKey++;
      const severityLabel =
        target.data.severity === "critical"
          ? "Critical fix!"
          : target.data.severity === "major"
            ? "Bug squashed!"
            : "Quick fix!";
      setMessages((prev) => [
        ...prev,
        {
          key,
          message: `${target.data.icon} ${severityLabel} +${fmt(reward)} LoC, -${Math.floor(tdReduction)} TD`,
          isPositive: true,
        },
      ]);
      setTimeout(() => setMessages((prev) => prev.filter((m) => m.key !== key)), 3000);

      removeItem(target.key);
    },
    [removeItem],
  );

  return (
    <>
      {items.map((b) => (
        <BugOrb key={b.key} spawned={b} onClick={() => handleFix(b)} />
      ))}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-60 pointer-events-none">
        {messages.map((m) => (
          <div
            key={m.key}
            className={`px-4 py-2 rounded-lg text-sm font-semibold animate-[bounce-in_0.3s_ease-out] ${
              m.isPositive
                ? "bg-accent-green/20 text-accent-green border border-accent-green/40"
                : "bg-red-500/20 text-red-400 border border-red-500/40"
            }`}
          >
            {m.message}
          </div>
        ))}
      </div>
    </>
  );
}

function applyMissPenalty(
  b: SpawnedItem<BugDefinition>,
  setMessages: React.Dispatch<React.SetStateAction<BugMessage[]>>,
) {
  const state = useGameStore.getState();
  const locPerSec = selectLocPerSecond(state);
  const penalty = Math.max(0, locPerSec * b.data.missPenaltySeconds);

  if (penalty > 0) {
    state.deductLoC(penalty);
  }

  if (b.data.missEffect === "production_freeze") {
    useGameStore.setState({
      refactoringUntil: Date.now() + 5_000,
    });
  } else if (b.data.missEffect === "td_double") {
    const currentTd = state.resources.techDebt ?? 0;
    useGameStore.setState({
      resources: {
        ...state.resources,
        linesOfCode: Math.max(0, state.resources.linesOfCode - penalty),
        techDebt: currentTd * 2,
        peakTechDebt: Math.max(state.resources.peakTechDebt ?? 0, currentTd * 2),
      },
    });
  }

  const severityText =
    b.data.severity === "critical"
      ? "CRITICAL escaped!"
      : b.data.severity === "major"
        ? "Bug escaped!"
        : "Bug slipped through.";

  const effectText =
    b.data.missEffect === "production_freeze"
      ? " Production frozen 5s!"
      : b.data.missEffect === "td_double"
        ? " Tech debt doubled!"
        : "";

  const key = msgKey++;
  setMessages((prev) => [
    ...prev,
    { key, message: `${b.data.icon} ${severityText} -${fmt(penalty)} LoC${effectText}`, isPositive: false },
  ]);
  setTimeout(() => setMessages((prev) => prev.filter((m) => m.key !== key)), 4000);
}

function BugOrb({ spawned, onClick }: { spawned: SpawnedItem<BugDefinition>; onClick: () => void }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - spawned.spawnedAt;
      setOpacity(Math.max(0, 1 - elapsed / spawned.data.lifetimeMs));
    }, 50);
    return () => clearInterval(interval);
  }, [spawned.spawnedAt, spawned.data.lifetimeMs]);

  const sev = spawned.data.severity;

  const sizeClass =
    sev === "critical" ? "w-16 h-16 text-3xl" : sev === "major" ? "w-14 h-14 text-2xl" : "w-12 h-12 text-xl";

  const borderClass =
    sev === "critical"
      ? "border-red-500/70 shadow-[0_0_25px_rgba(255,50,50,0.5)]"
      : sev === "major"
        ? "border-orange-500/60 shadow-[0_0_15px_rgba(255,150,50,0.3)]"
        : "border-green-500/40 shadow-[0_0_10px_rgba(50,255,50,0.2)]";

  const bgClass =
    sev === "critical"
      ? "from-red-500/30 to-red-700/30"
      : sev === "major"
        ? "from-orange-500/25 to-orange-700/25"
        : "from-green-500/20 to-green-700/20";

  const animSpeed = sev === "critical" ? "0.5s" : sev === "major" ? "0.8s" : "1.2s";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed z-60 pointer-events-auto rounded-full border-2 bg-gradient-to-br flex items-center justify-center cursor-pointer transition-transform hover:scale-125 active:scale-90 ${sizeClass} ${borderClass} ${bgClass}`}
      style={{
        left: spawned.x,
        top: spawned.y,
        opacity,
        animation: `${sev === "critical" ? "shake" : "bob"} ${animSpeed} ease-in-out infinite`,
      }}
      title={`${spawned.data.name} [${sev.toUpperCase()}] - Click to fix!`}
    >
      {spawned.data.icon}
    </button>
  );
}

function fmt(n: number): string {
  if (n < 10_000) return Math.floor(n).toLocaleString();
  const suffixes = ["", "K", "M", "B", "T"];
  const tier = Math.min(Math.floor(Math.log10(n) / 3), suffixes.length - 1);
  return `${(n / 10 ** (tier * 3)).toFixed(1)}${suffixes[tier]}`;
}
