import { useCallback, useEffect, useRef, useState } from "react";
import type { BuffContext, BuffDefinition } from "../../data/buffs";
import { pickRandomBuff } from "../../data/buffs";
import { useGameStore } from "../../store/gameStore";
import { selectClickValue, selectLocPerSecond } from "../../store/selectors";

interface SpawnedBuff {
  key: number;
  buff: BuffDefinition;
  x: number;
  y: number;
  spawnedAt: number;
}

const SPAWN_DURATION = 10_000; // 10 seconds to click
const MIN_SPAWN_INTERVAL = 45_000; // min 45s between spawns
const MAX_SPAWN_INTERVAL = 120_000; // max 2min between spawns

let spawnKey = 0;

interface BuffMessageItem {
  key: number;
  message: string;
  icon: string;
  rarity: string;
}

export function BuffSpawnLayer() {
  const [spawned, setSpawned] = useState<SpawnedBuff | null>(null);
  const [messages, setMessages] = useState<BuffMessageItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scheduleSpawn = useCallback(() => {
    const delay = MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
    timerRef.current = setTimeout(() => {
      const buff = pickRandomBuff();
      // Random position within the viewport, with padding
      const x = 100 + Math.random() * (window.innerWidth - 200);
      const y = 100 + Math.random() * (window.innerHeight - 200);
      const spawnedAt = Date.now();
      setSpawned({ key: spawnKey++, buff, x, y, spawnedAt });

      // Auto-despawn after SPAWN_DURATION
      setTimeout(() => {
        setSpawned((curr) => (curr?.spawnedAt === spawnedAt ? null : curr));
      }, SPAWN_DURATION);

      scheduleSpawn();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleSpawn();
    return () => clearTimeout(timerRef.current);
  }, [scheduleSpawn]);

  // Auto-despawn via interval check
  useEffect(() => {
    const interval = setInterval(() => {
      setSpawned((curr) => {
        if (!curr) return null;
        if (Date.now() - curr.spawnedAt > SPAWN_DURATION) return null;
        return curr;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback((s: SpawnedBuff) => {
    const state = useGameStore.getState();
    const ctx: BuffContext = {
      currentLoC: state.resources.linesOfCode,
      locPerSecond: selectLocPerSecond(state),
      clickValue: selectClickValue(state),
    };
    const result = s.buff.apply(ctx);

    // Apply instant LoC
    if (result.instantLoC && result.instantLoC > 0) {
      state.addLoC(result.instantLoC);
    }

    // Apply temporary multiplier buff
    if (result.productionMultiplier || result.clickMultiplier) {
      const duration = result.duration ?? 30;
      state.addBuff({
        id: `${s.buff.id}_${Date.now()}`,
        buffId: s.buff.id,
        productionMultiplier: result.productionMultiplier,
        clickMultiplier: result.clickMultiplier,
        expiresAt: Date.now() + duration * 1000,
      });
    }

    // Show message
    const msgKey = spawnKey++;
    setMessages((prev) => [
      ...prev,
      {
        key: msgKey,
        message: result.message,
        icon: s.buff.icon,
        rarity: s.buff.rarity,
      },
    ]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.key !== msgKey));
    }, 3500);

    setSpawned(null);
  }, []);

  return (
    <>
      {/* Spawned clickable buff */}
      {spawned && <SpawnedBuffButton key={spawned.key} spawned={spawned} onClick={() => handleClick(spawned)} />}

      {/* Buff messages */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
        {messages.map((m) => (
          <div
            key={m.key}
            className={`px-4 py-2 rounded-lg text-sm font-semibold animate-[bounce-in_0.3s_ease-out] ${
              m.rarity === "legendary"
                ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/40"
                : m.rarity === "rare"
                  ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/40"
                  : "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40"
            }`}
          >
            {m.icon} {m.message}
          </div>
        ))}
      </div>
    </>
  );
}

function SpawnedBuffButton({ spawned, onClick }: { spawned: SpawnedBuff; onClick: () => void }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - spawned.spawnedAt;
      const remaining = Math.max(0, 1 - elapsed / SPAWN_DURATION);
      setOpacity(remaining);
    }, 50);
    return () => clearInterval(interval);
  }, [spawned.spawnedAt]);

  const rarityStyles = {
    common: "from-cyan-500/30 to-cyan-600/30 border-accent-cyan/50 shadow-[0_0_20px_rgba(0,212,255,0.3)]",
    rare: "from-purple-500/30 to-purple-600/30 border-accent-purple/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    legendary: "from-yellow-500/30 to-yellow-600/30 border-accent-gold/50 shadow-[0_0_25px_rgba(255,215,0,0.4)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed z-40 w-16 h-16 rounded-full border-2 bg-gradient-to-br flex items-center justify-center text-3xl cursor-pointer transition-transform hover:scale-125 active:scale-90 ${rarityStyles[spawned.buff.rarity]}`}
      style={{
        left: spawned.x,
        top: spawned.y,
        opacity,
        animation: "bob 1.5s ease-in-out infinite",
      }}
      title={`${spawned.buff.name} - Click me!`}
    >
      {spawned.buff.icon}
    </button>
  );
}
