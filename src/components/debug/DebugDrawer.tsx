import { useState } from "react";
import { Drawer } from "vaul";
import type { BuffContext } from "../../data/buffs";
import { pickRandomBuff } from "../../data/buffs";
import { BUILDINGS } from "../../data/buildings";
import { useGameStore } from "../../store/gameStore";
import { selectClickValue, selectLocPerSecond } from "../../store/selectors";
import { formatNumber } from "../../utils/formatNumber";

const IS_DEBUG = import.meta.env.VITE_DEBUG === "true";

export function DebugDrawer() {
  if (!IS_DEBUG) return null;
  return <DebugDrawerInner />;
}

function DebugDrawerInner() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root direction="right" open={open} onOpenChange={setOpen}>
      {/* Trigger button - small, tucked in bottom-left */}
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-2 left-2 z-50 px-2 py-1 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
        >
          DEBUG
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed top-0 right-0 bottom-0 w-96 z-50 bg-bg-surface border-l border-white/10 outline-none flex flex-col">
          <div className="p-4 border-b border-white/5">
            <Drawer.Title className="text-lg font-bold text-red-400">
              Debug Panel
            </Drawer.Title>
            <Drawer.Description className="text-xs text-text-muted">
              Development tools for testing game mechanics
            </Drawer.Description>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ResourceSection />
            <TechDebtSection />
            <BuildingSection />
            <BuffSection />
            <TimeSection />
            <DangerSection />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold text-red-400/70 uppercase tracking-wider border-b border-white/5 pb-1">
      {title}
    </h3>
  );
}

function DebugButton({
  onClick,
  children,
  variant = "default",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
        variant === "danger"
          ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
          : "bg-white/5 text-text-primary border border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function ResourceSection() {
  const loc = useGameStore((s) => s.resources.linesOfCode);
  const addLoC = useGameStore((s) => s.addLoC);
  const amounts = [100, 1_000, 10_000, 100_000, 1_000_000, 1_000_000_000];

  return (
    <div className="space-y-2">
      <SectionHeader title="Resources" />
      <div className="text-xs text-text-muted">
        Current LoC:{" "}
        <span className="font-mono text-text-primary">{formatNumber(loc)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {amounts.map((amt) => (
          <DebugButton key={amt} onClick={() => addLoC(amt)}>
            +{formatNumber(amt)} LoC
          </DebugButton>
        ))}
      </div>
    </div>
  );
}

function TechDebtSection() {
  const td = useGameStore((s) => s.resources.techDebt);

  const addTD = (amount: number) => {
    const state = useGameStore.getState();
    useGameStore.setState({
      resources: {
        ...state.resources,
        techDebt: Math.max(0, (state.resources.techDebt ?? 0) + amount),
        peakTechDebt: Math.max(
          state.resources.peakTechDebt ?? 0,
          (state.resources.techDebt ?? 0) + amount,
        ),
      },
    });
  };

  const clearDebt = () => {
    const state = useGameStore.getState();
    useGameStore.setState({
      resources: { ...state.resources, techDebt: 0 },
    });
  };

  return (
    <div className="space-y-2">
      <SectionHeader title="Tech Debt" />
      <div className="text-xs text-text-muted">
        Current TD:{" "}
        <span className="font-mono text-accent-pink">{formatNumber(td)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <DebugButton onClick={() => addTD(100)}>+100 TD</DebugButton>
        <DebugButton onClick={() => addTD(1_000)}>+1K TD</DebugButton>
        <DebugButton onClick={() => addTD(10_000)}>+10K TD</DebugButton>
        <DebugButton onClick={() => addTD(50_000)}>+50K TD</DebugButton>
        <DebugButton variant="danger" onClick={clearDebt}>
          Clear All TD
        </DebugButton>
      </div>
    </div>
  );
}

function BuildingSection() {
  const buildings = useGameStore((s) => s.buildings);
  const setBuildingsDirectly = (buildingId: string, count: number) => {
    const state = useGameStore.getState();
    useGameStore.setState({
      buildings: state.buildings.map((b) =>
        b.id === buildingId ? { ...b, count } : b,
      ),
    });
  };

  return (
    <div className="space-y-2">
      <SectionHeader title="Buildings" />
      {BUILDINGS.map((def) => {
        const owned = buildings.find((b) => b.id === def.id);
        return (
          <div key={def.id} className="flex items-center gap-2">
            <span className="text-sm">{def.icon}</span>
            <span className="text-xs text-text-secondary flex-1 truncate">
              {def.name}
            </span>
            <span className="font-mono text-xs text-text-muted w-8 text-right">
              {owned?.count ?? 0}
            </span>
            <div className="flex gap-0.5">
              <DebugButton
                onClick={() => {
                  // Free purchase, bypass cost
                  const state = useGameStore.getState();
                  useGameStore.setState({
                    buildings: state.buildings.map((b) =>
                      b.id === def.id ? { ...b, count: b.count + 1 } : b,
                    ),
                  });
                }}
              >
                +1
              </DebugButton>
              <DebugButton
                onClick={() => {
                  const state = useGameStore.getState();
                  useGameStore.setState({
                    buildings: state.buildings.map((b) =>
                      b.id === def.id ? { ...b, count: b.count + 10 } : b,
                    ),
                  });
                }}
              >
                +10
              </DebugButton>
              <DebugButton onClick={() => setBuildingsDirectly(def.id, 100)}>
                =100
              </DebugButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BuffSection() {
  const addBuff = useGameStore((s) => s.addBuff);
  const addLoC = useGameStore((s) => s.addLoC);

  const spawnAndApplyBuff = () => {
    const buff = pickRandomBuff();
    const state = useGameStore.getState();
    const ctx: BuffContext = {
      currentLoC: state.resources.linesOfCode,
      locPerSecond: selectLocPerSecond(state),
      clickValue: selectClickValue(state),
    };
    const result = buff.apply(ctx);

    if (result.instantLoC && result.instantLoC > 0) {
      addLoC(result.instantLoC);
    }
    if (result.productionMultiplier || result.clickMultiplier) {
      const duration = result.duration ?? 30;
      addBuff({
        id: `debug_${buff.id}_${Date.now()}`,
        buffId: buff.id,
        productionMultiplier: result.productionMultiplier,
        clickMultiplier: result.clickMultiplier,
        expiresAt: Date.now() + duration * 1000,
      });
    }
  };

  const applySpecificBuff = (
    name: string,
    prodMult?: number,
    clickMult?: number,
    duration = 60,
  ) => {
    addBuff({
      id: `debug_${name}_${Date.now()}`,
      buffId: name,
      productionMultiplier: prodMult,
      clickMultiplier: clickMult,
      expiresAt: Date.now() + duration * 1000,
    });
  };

  return (
    <div className="space-y-2">
      <SectionHeader title="Buffs" />
      <div className="flex flex-wrap gap-1">
        <DebugButton onClick={spawnAndApplyBuff}>Random Buff</DebugButton>
        <DebugButton onClick={() => applySpecificBuff("prod_x10", 10)}>
          10x Prod (60s)
        </DebugButton>
        <DebugButton onClick={() => applySpecificBuff("prod_x100", 100)}>
          100x Prod (60s)
        </DebugButton>
        <DebugButton
          onClick={() => applySpecificBuff("click_x50", undefined, 50)}
        >
          50x Click (60s)
        </DebugButton>
        <DebugButton onClick={() => applySpecificBuff("mega", 1000, 1000, 120)}>
          1000x ALL (2min)
        </DebugButton>
      </div>
    </div>
  );
}

function TimeSection() {
  const simulateTime = (seconds: number) => {
    const state = useGameStore.getState();
    const locPerSec = selectLocPerSecond(state);
    const earned = locPerSec * seconds;
    useGameStore.getState().addLoC(earned);
    useGameStore.setState({
      stats: {
        ...state.stats,
        totalTimePlayed: state.stats.totalTimePlayed + seconds,
      },
    });
  };

  return (
    <div className="space-y-2">
      <SectionHeader title="Time Travel" />
      <p className="text-xs text-text-muted">
        Simulate passive production as if time passed
      </p>
      <div className="flex flex-wrap gap-1">
        <DebugButton onClick={() => simulateTime(60)}>+1 min</DebugButton>
        <DebugButton onClick={() => simulateTime(600)}>+10 min</DebugButton>
        <DebugButton onClick={() => simulateTime(3600)}>+1 hour</DebugButton>
        <DebugButton onClick={() => simulateTime(86400)}>+1 day</DebugButton>
      </div>
    </div>
  );
}

function DangerSection() {
  const resetGame = useGameStore((s) => s.resetGame);
  const [confirmed, setConfirmed] = useState(false);

  const addReputation = (amount: number) => {
    const state = useGameStore.getState();
    useGameStore.setState({
      prestige: {
        ...state.prestige,
        reputationPoints: state.prestige.reputationPoints + amount,
        totalReputationEarned: state.prestige.totalReputationEarned + amount,
      },
    });
  };

  const maxUpgrades = () => {
    const state = useGameStore.getState();
    // Set all buildings to 100
    useGameStore.setState({
      buildings: state.buildings.map((b) => ({
        ...b,
        count: Math.max(b.count, 100),
      })),
    });
    // Add enough LoC to buy all upgrades
    useGameStore.getState().addLoC(1e15);
  };

  return (
    <div className="space-y-2">
      <SectionHeader title="Prestige & Danger" />
      <div className="flex flex-wrap gap-1">
        <DebugButton onClick={() => addReputation(10)}>+10 Rep</DebugButton>
        <DebugButton onClick={() => addReputation(100)}>+100 Rep</DebugButton>
        <DebugButton onClick={() => addReputation(1000)}>+1000 Rep</DebugButton>
      </div>
      <div className="flex flex-wrap gap-1 pt-2">
        <DebugButton onClick={maxUpgrades}>Max Buildings + LoC</DebugButton>
      </div>
      <div className="pt-2">
        {!confirmed ? (
          <DebugButton variant="danger" onClick={() => setConfirmed(true)}>
            Reset Game...
          </DebugButton>
        ) : (
          <div className="flex items-center gap-2">
            <DebugButton
              variant="danger"
              onClick={() => {
                resetGame();
                setConfirmed(false);
              }}
            >
              Confirm Reset
            </DebugButton>
            <DebugButton onClick={() => setConfirmed(false)}>
              Cancel
            </DebugButton>
          </div>
        )}
      </div>
    </div>
  );
}
