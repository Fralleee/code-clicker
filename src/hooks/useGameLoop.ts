import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);

  useEffect(() => {
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      tick(delta);
    }, 50);
    return () => clearInterval(interval);
  }, [tick]);
}
