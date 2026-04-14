import { useEffect } from "react";
import { ACHIEVEMENTS } from "../data/achievements";
import { useGameStore } from "../store/gameStore";
import { selectLocPerSecond, selectTotalBuildings } from "../store/selectors";

export type AchievementUnlockCallback = (id: string, name: string) => void;

let onUnlockCallback: AchievementUnlockCallback | null = null;

export function setAchievementCallback(cb: AchievementUnlockCallback | null) {
  onUnlockCallback = cb;
}

export function useAchievementChecker() {
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => ({
        totalLoc: state.resources.totalLoCEarned,
        totalClicks: state.resources.totalClicks,
        buildings: state.buildings,
        prestige: state.prestige,
        unlocked: state.unlockedAchievements,
      }),
      (curr) => {
        const state = useGameStore.getState();
        const locPerSec = selectLocPerSecond(state);
        const totalBuildings = selectTotalBuildings(state);

        for (const ach of ACHIEVEMENTS) {
          if (curr.unlocked.includes(ach.id)) continue;

          let met = false;
          const cond = ach.condition;
          switch (cond.kind) {
            case "total_loc":
              met = curr.totalLoc >= cond.amount;
              break;
            case "total_clicks":
              met = curr.totalClicks >= cond.count;
              break;
            case "building_count": {
              const owned = curr.buildings.find((b) => b.id === cond.buildingId);
              met = (owned?.count ?? 0) >= cond.count;
              break;
            }
            case "total_buildings":
              met = totalBuildings >= cond.count;
              break;
            case "loc_per_second":
              met = locPerSec >= cond.amount;
              break;
            case "prestige_count":
              met = curr.prestige.timesShipped >= cond.count;
              break;
            case "reputation_points":
              met = curr.prestige.totalReputationEarned >= cond.amount;
              break;
          }

          if (met) {
            state.unlockAchievement(ach.id);
            onUnlockCallback?.(ach.id, ach.name);
          }
        }
      },
    );
    return unsub;
  }, []);
}
