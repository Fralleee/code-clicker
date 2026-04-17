import { useEffect, useState } from "react";

// `key` is assumed stable for the lifetime of the component; changing it won't re-read storage,
// and the current in-memory `value` will be persisted under the new key by the effect below.
export function useLocalStorageState<T>(key: string, initial: T, validate?: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw) as unknown;
      if (validate && !validate(parsed)) return initial;
      return parsed as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, serialized);
    } catch {
      // localStorage unavailable — ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}
