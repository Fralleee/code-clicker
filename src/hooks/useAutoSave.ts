import { useEffect } from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { useGameStore } from "../store/gameStore";

export function useAutoSave() {
  const saveGame = useGameStore((s) => s.saveGame);
  const autoSaveEnabled = useGameStore((s) => s.settings.autoSaveEnabled);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      saveGame();
    }, GAME_CONFIG.autosave.intervalMs);

    const handleBeforeUnload = () => saveGame();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveGame, autoSaveEnabled]);
}
