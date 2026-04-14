import { useEffect, useState } from "react";
import type { HackDefinition } from "../../data/hacks";
import { HACKS } from "../../data/hacks";
import { useGameStore } from "../../store/gameStore";
import { selectLocPerSecond } from "../../store/selectors";
import { formatNumber } from "../../utils/formatNumber";

export function HackPanel() {
  const totalLoCEarned = useGameStore((s) => s.resources.totalLoCEarned);
  const td = useGameStore((s) => s.resources.techDebt);
  const hackCooldowns = useGameStore((s) => s.hackCooldowns);
  const activateHack = useGameStore((s) => s.activateHack);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(interval);
  }, []);

  useGameStore((s) => s.resources.linesOfCode);
  const state = useGameStore.getState();
  const locPerSec = Math.abs(selectLocPerSecond(state)) + 1;

  const visibleHacks = HACKS.filter((h) => totalLoCEarned >= h.unlockThreshold);

  if (visibleHacks.length === 0) {
    return <div className="text-center text-text-muted text-sm py-8">Keep coding to unlock hacks...</div>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted mb-2">Boosts that add Tech Debt. Requires low TD to activate.</p>
      {visibleHacks.map((hack) => (
        <HackButton
          key={hack.id}
          hack={hack}
          td={td}
          locPerSec={locPerSec}
          cooldownEnd={hackCooldowns[hack.id] ?? 0}
          onActivate={() => activateHack(hack.id)}
        />
      ))}
    </div>
  );
}

function HackButton({
  hack,
  td,
  locPerSec,
  cooldownEnd,
  onActivate,
}: {
  hack: HackDefinition;
  td: number;
  locPerSec: number;
  cooldownEnd: number;
  onActivate: () => void;
}) {
  const now = Date.now();
  const onCooldown = cooldownEnd > now;
  const cooldownTotal = hack.cooldownSeconds * 1000;
  const cooldownRemaining = onCooldown ? cooldownEnd - now : 0;
  const cooldownProgress = onCooldown ? cooldownRemaining / cooldownTotal : 0;
  const remainingSec = Math.ceil(cooldownRemaining / 1000);

  const tdCost = locPerSec * hack.techDebtCostSeconds;
  const maxTD = locPerSec * hack.maxTechDebtSeconds;
  const tooMuchDebt = td > maxTD;
  const disabled = onCooldown || tooMuchDebt;

  // Radial cooldown: SVG circle that depletes clockwise
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - cooldownProgress);

  return (
    <button
      type="button"
      onClick={onActivate}
      disabled={disabled}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        disabled
          ? "bg-bg-card/50 border-white/5 cursor-not-allowed"
          : "bg-bg-card hover:bg-bg-card-hover border-accent-pink/30 cursor-pointer hover:border-accent-pink/50"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Radial cooldown icon */}
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
          <span className={`text-xl ${onCooldown ? "opacity-40" : ""}`}>{hack.icon}</span>
          {onCooldown && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(255,62,157,0.3)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                stroke="rgb(255,62,157)"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-none"
              />
            </svg>
          )}
          {onCooldown && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-accent-pink font-bold">
              {remainingSec}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-text-primary">{hack.name}</div>
          <div className="text-xs text-text-muted mb-1">{hack.description}</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-accent-pink">+{formatNumber(tdCost)} TD</span>
            <span className={tooMuchDebt ? "text-red-400 font-semibold" : "text-text-muted"}>
              {tooMuchDebt ? "Too much debt!" : `Max TD: ${formatNumber(maxTD)}`}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
