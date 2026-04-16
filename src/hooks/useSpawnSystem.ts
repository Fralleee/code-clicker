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
  paddingTop?: number;
  paddingBottom?: number;
}

let globalKey = 0;

export function useSpawnSystem<T>(config: SpawnConfig<T>, rescheduleTrigger?: unknown) {
  const [items, setItems] = useState<SpawnedItem<T>[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);
  const configRef = useRef(config);
  configRef.current = config;

  const scheduleSpawn = useCallback(() => {
    const { min, max } = configRef.current.getInterval();
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0) return;

    const delay = min + Math.random() * Math.max(0, max - min);
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      setItems((current) => {
        if (!configRef.current.canSpawn(current)) return current;

        const data = configRef.current.createItem();
        const padX = configRef.current.padding ?? 100;
        const padTop = configRef.current.paddingTop ?? padX;
        const padBottom = configRef.current.paddingBottom ?? padX;
        const x = Math.max(0, padX + Math.random() * Math.max(0, window.innerWidth - padX * 2));
        const y = Math.max(0, padTop + Math.random() * Math.max(0, window.innerHeight - padTop - padBottom));

        return [...current, { key: globalKey++, data, x, y, spawnedAt: Date.now() }];
      });

      scheduleSpawn();
    }, delay);
  }, []);

  // Reschedule when trigger changes (e.g., tech debt for bug spawn rate)
  // biome-ignore lint/correctness/useExhaustiveDependencies: rescheduleTrigger is an intentional external trigger
  useEffect(() => {
    mountedRef.current = true;
    clearTimeout(timerRef.current);
    scheduleSpawn();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, [scheduleSpawn, rescheduleTrigger]);

  // Check for expired items every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expired: SpawnedItem<T>[] = [];

      setItems((current) => {
        expired.length = 0; // Reset for StrictMode double-invocation
        const alive: SpawnedItem<T>[] = [];
        for (const item of current) {
          if (now - item.spawnedAt > configRef.current.getLifetime(item.data)) {
            expired.push(item);
          } else {
            alive.push(item);
          }
        }
        return alive.length === current.length ? current : alive;
      });

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
