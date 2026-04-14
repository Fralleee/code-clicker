import { ACHIEVEMENTS } from "../../data/achievements";
import { useGameStore } from "../../store/gameStore";

export function AchievementList() {
  const unlocked = useGameStore((s) => s.unlockedAchievements);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
      </h3>
      {ACHIEVEMENTS.map((ach) => {
        const isUnlocked = unlocked.includes(ach.id);
        return (
          <div
            key={ach.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
              isUnlocked ? "opacity-100" : "opacity-30"
            }`}
            title={isUnlocked ? ach.description : "???"}
          >
            <span className="text-base">{isUnlocked ? ach.icon : "🔒"}</span>
            <div className="min-w-0">
              <div className={`font-medium truncate ${isUnlocked ? "text-text-primary" : "text-text-muted"}`}>
                {isUnlocked ? ach.name : "???"}
              </div>
              <div className="text-text-muted truncate">{isUnlocked ? ach.description : "Keep playing..."}</div>
            </div>
            {isUnlocked && ach.reward && (
              <span className="shrink-0 text-accent-gold text-[10px]">
                +{Math.round((ach.reward.multiplier - 1) * 100)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
