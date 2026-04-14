import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

export function useAutoSave() {
  const saveGame = useGameStore((s) => s.saveGame);
  const autoSaveEnabled = useGameStore((s) => s.settings.autoSaveEnabled);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      saveGame();
    }, 30000);

    const handleBeforeUnload = () => saveGame();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveGame, autoSaveEnabled]);
}
