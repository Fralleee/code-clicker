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

export function useSpawnSystem<T>(config: SpawnConfig<T>) {
  const [items, setItems] = useState<SpawnedItem<T>[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const configRef = useRef(config);
  configRef.current = config;

  const scheduleSpawn = useCallback(() => {
    const { min, max } = configRef.current.getInterval();
    if (!Number.isFinite(min)) return;

    const delay = min + Math.random() * (max - min);
    timerRef.current = setTimeout(() => {
      setItems((current) => {
        if (!configRef.current.canSpawn(current)) return current;

        const data = configRef.current.createItem();
        const pad = configRef.current.padding ?? 100;
        const x = pad + Math.random() * (window.innerWidth - pad * 2);
        const y = pad + Math.random() * (window.innerHeight - pad * 2);

        return [...current, { key: globalKey++, data, x, y, spawnedAt: Date.now() }];
      });

      scheduleSpawn();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleSpawn();
    return () => clearTimeout(timerRef.current);
  }, [scheduleSpawn]);

  // Check for expired items every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setItems((current) => {
        const alive: SpawnedItem<T>[] = [];
        for (const item of current) {
          const lifetime = configRef.current.getLifetime(item.data);
          if (now - item.spawnedAt > lifetime) {
            configRef.current.onExpire?.(item);
          } else {
            alive.push(item);
          }
        }
        return alive.length === current.length ? current : alive;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const removeItem = useCallback((key: number) => {
    setItems((current) => current.filter((i) => i.key !== key));
  }, []);

  return { items, removeItem };
}
