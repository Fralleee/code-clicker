import { useCallback, useEffect, useRef, useState } from "react";
import type { BugDefinition } from "../../data/bugs";
import { getBugSpawnInterval, getMaxActiveBugs, pickRandomBug } from "../../data/bugs";
import { useGameStore } from "../../store/gameStore";
import { selectIsBugImmune, selectLocPerSecond, selectRawLocPerSecond } from "../../store/selectors";

interface SpawnedBug {
  key: number;
  bug: BugDefinition;
  x: number;
  y: number;
  spawnedAt: number;
}

interface BugMessage {
  key: number;
  message: string;
  isPositive: boolean;
}

let bugKey = 0;

export function BugSpawnLayer() {
  const [bugs, setBugs] = useState<SpawnedBug[]>([]);
  const [messages, setMessages] = useState<BugMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const td = useGameStore((s) => s.resources.techDebt);

  const scheduleSpawn = useCallback(() => {
    // Reference td to trigger re-scheduling when debt changes
    void td;
    const state = useGameStore.getState();
    const rawLoC = selectRawLocPerSecond(state);
    const currentTd = state.resources.techDebt ?? 0;
    const { min, max } = getBugSpawnInterval(rawLoC, currentTd);
    if (!Number.isFinite(min)) return;

    const delay = min + Math.random() * (max - min);
    timerRef.current = setTimeout(() => {
      const freshState = useGameStore.getState();
      const freshRawLoC = selectRawLocPerSecond(freshState);
      const freshTd = freshState.resources.techDebt ?? 0;

      if (selectIsBugImmune(freshState)) {
        scheduleSpawn();
        return;
      }

      setBugs((current) => {
        const maxBugs = getMaxActiveBugs(freshRawLoC, freshTd);
        if (current.length >= maxBugs) return current;

        const bug = pickRandomBug(freshRawLoC, freshTd);
        const x = 80 + Math.random() * (window.innerWidth - 160);
        const y = 80 + Math.random() * (window.innerHeight - 160);
        return [...current, { key: bugKey++, bug, x, y, spawnedAt: Date.now() }];
      });

      scheduleSpawn();
    }, delay);
  }, [td]);

  useEffect(() => {
    scheduleSpawn();
    return () => clearTimeout(timerRef.current);
  }, [scheduleSpawn]);

  // Check for expired bugs every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBugs((current) => {
        const expired: SpawnedBug[] = [];
        const alive: SpawnedBug[] = [];
        for (const b of current) {
          if (now - b.spawnedAt > b.bug.lifetimeMs) {
            expired.push(b);
          } else {
            alive.push(b);
          }
        }
        for (const b of expired) {
          applyMissPenalty(b, setMessages);
        }
        return alive;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleFix = useCallback((target: SpawnedBug) => {
    const state = useGameStore.getState();
    const locPerSec = selectLocPerSecond(state);

    const reward = Math.max(0, locPerSec * target.bug.fixRewardSeconds);
    if (reward > 0) state.addLoC(reward);

    const tdReduction = Math.max(5, (state.resources.techDebt ?? 0) * target.bug.fixTdReductionPercent);
    state.reduceTechDebt(tdReduction);

    const msgKey = bugKey++;
    const severityLabel =
      target.bug.severity === "critical"
        ? "Critical fix!"
        : target.bug.severity === "major"
          ? "Bug squashed!"
          : "Quick fix!";
    setMessages((prev) => [
      ...prev,
      {
        key: msgKey,
        message: `${target.bug.icon} ${severityLabel} +${fmt(reward)} LoC, -${Math.floor(tdReduction)} TD`,
        isPositive: true,
      },
    ]);
    setTimeout(() => setMessages((prev) => prev.filter((m) => m.key !== msgKey)), 3000);

    setBugs((current) => current.filter((b) => b.key !== target.key));
  }, []);

  return (
    <>
      {bugs.map((b) => (
        <BugOrb key={b.key} spawned={b} onClick={() => handleFix(b)} />
      ))}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
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

function applyMissPenalty(b: SpawnedBug, setMessages: React.Dispatch<React.SetStateAction<BugMessage[]>>) {
  const state = useGameStore.getState();
  const locPerSec = selectLocPerSecond(state);
  const penalty = Math.max(0, locPerSec * b.bug.missPenaltySeconds);

  if (penalty > 0) {
    state.deductLoC(penalty);
  }

  // Apply special miss effects
  if (b.bug.missEffect === "production_freeze") {
    // Mini-refactor: pause production for 5 seconds
    useGameStore.setState({
      refactoringUntil: Date.now() + 5_000,
    });
  } else if (b.bug.missEffect === "td_double") {
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
    b.bug.severity === "critical"
      ? "CRITICAL escaped!"
      : b.bug.severity === "major"
        ? "Bug escaped!"
        : "Bug slipped through.";

  const effectText =
    b.bug.missEffect === "production_freeze"
      ? " Production frozen 5s!"
      : b.bug.missEffect === "td_double"
        ? " Tech debt doubled!"
        : "";

  const msgKey = bugKey++;
  setMessages((prev) => [
    ...prev,
    {
      key: msgKey,
      message: `${b.bug.icon} ${severityText} -${fmt(penalty)} LoC${effectText}`,
      isPositive: false,
    },
  ]);
  setTimeout(() => setMessages((prev) => prev.filter((m) => m.key !== msgKey)), 4000);
}

function BugOrb({ spawned, onClick }: { spawned: SpawnedBug; onClick: () => void }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - spawned.spawnedAt;
      setOpacity(Math.max(0, 1 - elapsed / spawned.bug.lifetimeMs));
    }, 50);
    return () => clearInterval(interval);
  }, [spawned.spawnedAt, spawned.bug.lifetimeMs]);

  const sev = spawned.bug.severity;

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
      className={`fixed z-40 rounded-full border-2 bg-gradient-to-br flex items-center justify-center cursor-pointer transition-transform hover:scale-125 active:scale-90 ${sizeClass} ${borderClass} ${bgClass}`}
      style={{
        left: spawned.x,
        top: spawned.y,
        opacity,
        animation: `${sev === "critical" ? "shake" : "bob"} ${animSpeed} ease-in-out infinite`,
      }}
      title={`${spawned.bug.name} [${sev.toUpperCase()}] - Click to fix!`}
    >
      {spawned.bug.icon}
    </button>
  );
}

function fmt(n: number): string {
  if (n < 10_000) return Math.floor(n).toLocaleString();
  const suffixes = ["", "K", "M", "B", "T"];
  const tier = Math.min(Math.floor(Math.log10(n) / 3), suffixes.length - 1);
  return `${(n / 10 ** (tier * 3)).toFixed(1)}${suffixes[tier]}`;
}
