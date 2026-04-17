import { useCallback, useEffect, useState } from "react";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { BuffContext, BuffDefinition } from "../../data/buffs";
import { pickRandomBuff } from "../../data/buffs";
import type { SpawnedItem } from "../../hooks/useSpawnSystem";
import { useSpawnSystem } from "../../hooks/useSpawnSystem";
import { useGameStore } from "../../store/gameStore";
import { selectClickValue, selectIsSurgeActive, selectLocPerSecond } from "../../store/selectors";

const SPAWN_DURATION = GAME_CONFIG.buffs.spawnDurationMs;

interface BuffMessageItem {
  key: number;
  message: string;
  icon: string;
  rarity: string;
}

let msgKey = 0;

export function BuffSpawnLayer() {
  const [messages, setMessages] = useState<BuffMessageItem[]>([]);
  const surgeStartedAt = useGameStore((s) => s.surgeStartedAt);

  const { items, removeItem } = useSpawnSystem<BuffDefinition>(
    {
      getInterval: () => {
        const surgeActive = selectIsSurgeActive(useGameStore.getState());
        const divisor = surgeActive ? 2 : 1;
        return {
          min: GAME_CONFIG.buffs.minSpawnIntervalMs / divisor,
          max: GAME_CONFIG.buffs.maxSpawnIntervalMs / divisor,
        };
      },
      canSpawn: (current) => current.length === 0,
      createItem: () => pickRandomBuff(),
      getLifetime: () => SPAWN_DURATION,
      paddingTop: 120,
      paddingBottom: 80,
    },
    surgeStartedAt,
  );

  const handleClick = useCallback(
    (item: SpawnedItem<BuffDefinition>) => {
      const state = useGameStore.getState();
      const ctx: BuffContext = {
        currentLoC: state.resources.linesOfCode,
        locPerSecond: selectLocPerSecond(state),
        clickValue: selectClickValue(state),
      };
      const result = item.data.apply(ctx);

      if (result.instantLoC && result.instantLoC > 0) {
        state.addLoC(result.instantLoC);
      }

      if (result.productionMultiplier || result.clickMultiplier) {
        let duration = result.duration ?? 30;
        if (state.prestige.prestigeUpgrades.includes("buff_mastery")) duration *= 2;
        if (selectIsSurgeActive(state)) duration *= 2;
        state.addBuff({
          id: `${item.data.id}_${Date.now()}`,
          buffId: item.data.id,
          productionMultiplier: result.productionMultiplier,
          clickMultiplier: result.clickMultiplier,
          expiresAt: Date.now() + duration * 1000,
        });
      }

      const key = msgKey++;
      setMessages((prev) => [
        ...prev,
        { key, message: result.message, icon: item.data.icon, rarity: item.data.rarity },
      ]);
      setTimeout(() => setMessages((prev) => prev.filter((m) => m.key !== key)), 3500);

      removeItem(item.key);
    },
    [removeItem],
  );

  const spawned = items[0] ?? null;

  return (
    <>
      {spawned && <SpawnedBuffButton key={spawned.key} spawned={spawned} onClick={() => handleClick(spawned)} />}

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

function SpawnedBuffButton({ spawned, onClick }: { spawned: SpawnedItem<BuffDefinition>; onClick: () => void }) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - spawned.spawnedAt;
      setOpacity(Math.max(0, 1 - elapsed / SPAWN_DURATION));
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
      className={`fixed z-40 w-16 h-16 rounded-full border-2 bg-gradient-to-br flex items-center justify-center text-3xl cursor-pointer transition-transform hover:scale-125 active:scale-90 ${rarityStyles[spawned.data.rarity]}`}
      style={{
        left: spawned.x,
        top: spawned.y,
        opacity,
        animation: "bob 1.5s ease-in-out infinite",
      }}
      title={`${spawned.data.name} - Click me!`}
    >
      {spawned.data.icon}
    </button>
  );
}
