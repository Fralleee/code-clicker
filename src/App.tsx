import { useEffect, useRef, useState } from "react";
import {
  AchievementToastLayer,
  useAchievementToasts,
} from "./components/achievements/AchievementToast";
import { ActiveBuffBar } from "./components/buffs/ActiveBuffBar";
import { BuffSpawnLayer } from "./components/buffs/BuffSpawn";
import { BugSpawnLayer } from "./components/bugs/BugSpawnLayer";
import { CodeEditor } from "./components/clicker/CodeEditor";
import { DebugDrawer } from "./components/debug/DebugDrawer";
import { HelpDrawer } from "./components/help/HelpDrawer";
import { StatsPanel } from "./components/layout/StatsPanel";
import { TopBar } from "./components/layout/TopBar";
import { PrestigeModal } from "./components/prestige/PrestigeModal";
import { ShopPanel } from "./components/shop/ShopPanel";
import { VictoryModal } from "./components/victory/VictoryModal";
import {
  setAchievementCallback,
  useAchievementChecker,
} from "./hooks/useAchievementChecker";
import { useAutoSave } from "./hooks/useAutoSave";
import { useGameLoop } from "./hooks/useGameLoop";
import { useGameStore } from "./store/gameStore";
import { selectHasWon } from "./store/selectors";

export default function App() {
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [dismissedForShip, setDismissedForShip] = useState(0);
  const { toasts, showToast } = useAchievementToasts();
  const prevTimesShipped = useRef(0);

  // Load saved game on mount
  useEffect(() => {
    useGameStore.getState().loadGame();
    prevTimesShipped.current =
      useGameStore.getState().prestige.timesShipped;
  }, []);

  // Set up achievement callback
  useEffect(() => {
    setAchievementCallback(showToast);
    return () => setAchievementCallback(null);
  }, [showToast]);

  // Game loop, auto-save, achievement checker
  useGameLoop();
  useAutoSave();
  useAchievementChecker();

  // Track prestige to reset victory dismissal
  const timesShipped = useGameStore((s) => s.prestige.timesShipped);
  useEffect(() => {
    if (timesShipped > prevTimesShipped.current) {
      setDismissedForShip(0);
      setVictoryOpen(false);
      prevTimesShipped.current = timesShipped;
    }
  }, [timesShipped]);

  // Win check: compute hasWon directly as derived state
  const hasWon = useGameStore((s) => selectHasWon(s));
  useEffect(() => {
    if (!hasWon) return;
    if (dismissedForShip > 0) return;
    if (victoryOpen) return;
    setVictoryOpen(true);
  }, [hasWon, dismissedForShip, victoryOpen]);

  return (
    <div className="flex flex-col h-screen bg-bg-deep">
      <TopBar
        onPrestigeClick={() => setPrestigeOpen(true)}
        onHelpClick={() => setHelpOpen(true)}
      />
      <ActiveBuffBar />

      <div className="flex flex-1 min-h-0">
        {/* Left panel - Stats & Achievements */}
        <aside className="flex-1 min-w-56 border-r border-white/5 bg-bg-surface overflow-hidden">
          <StatsPanel />
        </aside>

        {/* Center - Code Editor (capped at 640x480) */}
        <main className="shrink-0 p-4 flex items-start justify-center">
          <div className="w-160 h-120">
            <CodeEditor />
          </div>
        </main>

        {/* Right panel - Shop */}
        <aside className="flex-1 min-w-72 border-l border-white/5 bg-bg-surface overflow-hidden">
          <ShopPanel />
        </aside>
      </div>

      {/* Modals & overlays */}
      <PrestigeModal
        open={prestigeOpen}
        onClose={() => setPrestigeOpen(false)}
      />
      <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} />
      <VictoryModal
        open={victoryOpen}
        onClose={() => {
          setVictoryOpen(false);
          setDismissedForShip(timesShipped);
        }}
      />
      <AchievementToastLayer toasts={toasts} />
      <BuffSpawnLayer />
      <BugSpawnLayer />
      <DebugDrawer />
    </div>
  );
}
