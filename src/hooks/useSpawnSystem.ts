import { useCallback, useEffect, useRef, useState } from "react";

export interface SpawnedItem<T> {
  key: number;
  data: T;
  x: number;
  y: number;
  spawnedAt: number;
}

export interface SpawnConfig<T> {
  getInterval: () => { min: number; max: number };
  canSpawn: (currentItems: SpawnedItem<T>[]) => boolean;
  createItem: () => T;
  getLifetime: (item: T) => number;
  onExpire?: (item: SpawnedItem<T>) => void;
  padding?: number;
}

let globalKey = 0;

export function useSpawnSystem<T>(config: SpawnConfig<T>, rescheduleTrigger?: unknown) {
  const [items, setItems] = useState<SpawnedItem<T>[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const configRef = useRef(config);
  configRef.current = config;

  const scheduleSpawn = useCallback(() => {
    const { min, max } = configRef.current.getInterval();
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0) return;

    const delay = min + Math.random() * Math.max(0, max - min);
    timerRef.current = setTimeout(() => {
      setItems((current) => {
        if (!configRef.current.canSpawn(current)) return current;

        const data = configRef.current.createItem();
        const pad = configRef.current.padding ?? 100;
        const x = Math.max(0, pad + Math.random() * Math.max(0, window.innerWidth - pad * 2));
        const y = Math.max(0, pad + Math.random() * Math.max(0, window.innerHeight - pad * 2));

        return [...current, { key: globalKey++, data, x, y, spawnedAt: Date.now() }];
      });

      scheduleSpawn();
    }, delay);
  }, []);

  // Reschedule when trigger changes (e.g., tech debt for bug spawn rate)
  const triggerRef = useRef(rescheduleTrigger);
  useEffect(() => {
    triggerRef.current = rescheduleTrigger;
    clearTimeout(timerRef.current);
    scheduleSpawn();
    return () => clearTimeout(timerRef.current);
  }, [scheduleSpawn, rescheduleTrigger]);

  // Check for expired items every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let expired: SpawnedItem<T>[] = [];

      setItems((current) => {
        expired = [];
        const alive: SpawnedItem<T>[] = [];
        for (const item of current) {
          const lifetime = configRef.current.getLifetime(item.data);
          if (now - item.spawnedAt > lifetime) {
            expired.push(item);
          } else {
            alive.push(item);
          }
        }
        return alive.length === current.length ? current : alive;
      });

      // Side effects outside the state updater (safe for StrictMode)
      for (const item of expired) {
        configRef.current.onExpire?.(item);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const removeItem = useCallback((key: number) => {
    setItems((current) => current.filter((i) => i.key !== key));
  }, []);

  return { items, removeItem };
}
