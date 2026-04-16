import { useEffect, useState } from "react";
import { BUFFS } from "../../data/buffs";
import { useGameStore } from "../../store/gameStore";

export function ActiveBuffBar() {
  const activeBuffs = useGameStore((s) => s.activeBuffs);
  const cleanExpiredBuffs = useGameStore((s) => s.cleanExpiredBuffs);
  const [, setTick] = useState(0);

  // Force re-render for countdown + cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredBuffs();
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [cleanExpiredBuffs]);

  const now = Date.now();
  const active = activeBuffs.filter((b) => b.expiresAt > now);

  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-4 py-1 lg:py-1.5 bg-bg-editor-bar/50 border-b border-white/5 overflow-x-auto">
      <span className="text-xs text-text-muted">Active:</span>
      {active.map((buff) => {
        const def = BUFFS.find((b) => b.id === buff.buffId);
        const remaining = Math.max(0, Math.ceil((buff.expiresAt - now) / 1000));
        return (
          <div
            key={buff.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-xs"
            title={def?.description}
          >
            <span>{def?.icon ?? "?"}</span>
            <span className="text-accent-cyan font-mono">{remaining}s</span>
          </div>
        );
      })}
    </div>
  );
}
