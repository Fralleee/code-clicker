import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

export function useGameLoop() {
  useEffect(() => {
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      useGameStore.getState().tick(delta);
    }, 50);
    return () => clearInterval(interval);
  }, []);
}
