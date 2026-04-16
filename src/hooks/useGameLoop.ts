import { useEffect } from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { useGameStore } from "../store/gameStore";

export function useGameLoop() {
  useEffect(() => {
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      useGameStore.getState().tick(delta);
    }, GAME_CONFIG.tick.intervalMs);
    return () => clearInterval(interval);
  }, []);
}
