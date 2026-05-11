# Reinos & Promessas

Jogo web de estratégia territorial bíblico inspirado em War, ambientado no Antigo Testamento. MVP local sem backend, login ou multiplayer.

## Run & Operate

- `pnpm --filter @workspace/reinos-promessas run dev` — run the game (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React + Vite + Tailwind CSS
- Zustand (with `persist` middleware → localStorage)
- Wouter for routing
- No backend, no database, no auth

## Where things live

- `artifacts/reinos-promessas/src/types/index.ts` — all core TypeScript types
- `artifacts/reinos-promessas/src/game-core/` — pure game logic (combat, movement, resources, turn, victory)
- `artifacts/reinos-promessas/src/game-data/` — static data (territories, regions, cards, objectives, factions)
- `artifacts/reinos-promessas/src/store/gameStore.ts` — Zustand store (persisted to localStorage)
- `artifacts/reinos-promessas/src/pages/` — React pages (HomePage, GamePage)

## Architecture decisions

- Game logic is **pure TypeScript** with no React dependency — ready to extract into a shared package for Expo/React Native later.
- `game-core` only receives data and returns new state — no mutations, no side effects.
- `game-data` is fully static and type-safe.
- Zustand `persist` middleware handles localStorage save/load automatically.
- Wouter provides lightweight client-side routing without a backend.

## Product

- Home screen: start new game, continue saved game, configure player count (2–6)
- Game screen: turn-based gameplay with resource management, card system, combat, movement
- 21 territories across the ancient Near East (Canaã, Egito, Assíria, Babilônia, etc.)
- 10 regions with control bonuses
- 14 cards (blessings, curses, army cards, prophecies, events)
- 10 secret objectives
- 6 playable factions (Israel, Judá, Filisteus, Edomitas, Arameanos, Fenícios)

## User preferences

- No backend, no database, no auth, no multiplayer for this MVP
- Architecture must be reusable for Expo/React Native in the future
- Separate game logic (`game-core`) from UI (`pages/components`) completely

## Gotchas

- Do NOT add a backend or database to this project — it is intentionally frontend-only
- `game-core` functions must remain pure (no React imports, no side effects)
- Always run `pnpm run typecheck` after significant changes
- Zustand persist key: `reinos-promessas-save`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
