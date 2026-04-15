export const STANDARD_BUILDING_UPGRADE_LEVELS = [
  10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500,
] as const;

export function getStandardUpgradeIds(buildingId: string): string[] {
  return STANDARD_BUILDING_UPGRADE_LEVELS.map((_, index) => `${buildingId}_${index + 1}`);
}
