# CodeClicker

A programming-themed idle/incremental game.

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** with `subscribeWithSelector` for state management
- **Tailwind CSS v4** for styling
- **Biome** for linting/formatting
- **Bun** as package manager
- **Vaul** for drawer components

## Architecture

- `src/data/` — Game data as typed constants (buildings, upgrades, achievements, hacks, bugs, buffs, prestige)
- `src/store/gameStore.ts` — Single Zustand store for all game state and actions
- `src/store/selectors.ts` — Pure functions computing derived state (production, click value, tech debt penalty, mastery)
- `src/types/game.ts` — All TypeScript interfaces and discriminated unions
- `src/hooks/` — Game loop (50ms tick), auto-save, achievement checker
- `src/utils/` — Number formatting, cost calculations, save/load (localStorage with versioned migrations)

## Key Design Decisions

- **Data-driven**: All game content defined in `src/data/`. Adding a building/upgrade means editing one array.
- **Multiplicative production chain**: Each building's output passes through ~10 independent multiplier layers (upgrades, prestige, buffs, tech debt, mastery).
- **Tech debt as organic mechanic**: Every building generates TD proportional to output. Penalty scales dynamically with production rate, not static thresholds.
- **Save versioning**: `SAVE_VERSION` in saveManager.ts with chained migration functions for backward compatibility.
- **Granular Zustand selectors**: Components subscribe to specific state slices to avoid full-app re-renders on 50ms ticks.

## Scripts

```
bun dev        # Start dev server
bun run build  # Type-check + production build
bun run lint   # Biome check
```
