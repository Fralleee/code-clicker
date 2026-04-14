import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENTS } from "../../data/achievements";

interface ToastItem {
  id: string;
  name: string;
  icon: string;
  key: number;
}

let nextKey = 0;

export function useAchievementToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((achievementId: string, name: string) => {
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    const key = nextKey++;
    setToasts((prev) => [...prev, { id: achievementId, name, icon: ach?.icon ?? "🏆", key }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.key !== key));
    }, 4000);
  }, []);

  return { toasts, showToast };
}

interface Props {
  toasts: ToastItem[];
}

export function AchievementToastLayer({ toasts }: Props) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <AchievementToastItem key={t.key} toast={t} />
      ))}
    </div>
  );
}

function AchievementToastItem({ toast }: { toast: ToastItem }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-card border border-accent-gold/30 shadow-lg ${
        exiting ? "animate-[slide-out-right_0.5s_ease-in_forwards]" : "animate-[slide-in-right_0.3s_ease-out]"
      }`}
    >
      <span className="text-2xl">{toast.icon}</span>
      <div>
        <div className="text-xs text-accent-gold font-semibold">Achievement Unlocked!</div>
        <div className="text-sm text-text-primary">{toast.name}</div>
      </div>
    </div>
  );
}
