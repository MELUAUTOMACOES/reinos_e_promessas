
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, GamePhase, PlayerId, TerritoryId } from "@/types";
import { TERRITORIES } from "@/game-data/territories";
import { REGIONS } from "@/game-data/regions";
import { CARDS } from "@/game-data/cards";
import { FACTIONS } from "@/game-data/factions";
import { advancePhase } from "@/game-core/turn";
import { checkVictory } from "@/game-core/victory";
import { resolveCombat } from "@/game-core/combat";
import { canAttack, canMove } from "@/game-core/movement";

const STORAGE_KEY = "reinos-promessas-save";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createInitialGameState(playerCount: number): GameState {
  const factions = shuffleArray(FACTIONS).slice(0, playerCount);
  const players = factions.map((f, i) => ({
    id: `player_${i}`,
    name: f.name,
    color: f.color,
    faction: f.name,
    resources: { gold: 5, food: 5, faith: 10 },
    faith: 10,
    stability: 80,
    isBot: i > 0,
    secretObjectiveId: null as null,
  }));

  const shuffledDeck = shuffleArray(CARDS);
  const territories: import("@/types").Territory[] = TERRITORIES.map((t) => ({ ...t, armies: 0, ownerId: null as string | null }));

  // Distribute starting territories evenly
  const shuffledTerritories = shuffleArray(territories.map((t) => t.id));
  const perPlayer = Math.floor(shuffledTerritories.length / playerCount);

  for (let i = 0; i < playerCount; i++) {
    const slice = shuffledTerritories.slice(i * perPlayer, (i + 1) * perPlayer);
    for (const tid of slice) {
      const t = territories.find((t) => t.id === tid);
      if (t) {
        t.ownerId = players[i].id;
        t.armies = 2;
      }
    }
  }

  const hands: Record<PlayerId, typeof CARDS> = {};
  for (const p of players) hands[p.id] = [];

  return {
    id: `game_${Date.now()}`,
    phase: "production",
    turn: 1,
    currentPlayerId: players[0].id,
    players,
    territories,
    regions: REGIONS,
    deck: shuffledDeck,
    discard: [],
    hands,
    winner: null,
    log: ["A partida começou! Que Deus guie os seus passos."],
    savedAt: null,
  };
}

interface GameStore {
  game: GameState | null;
  startGame: (playerCount: number) => void;
  resetGame: () => void;
  advancePhase: () => void;
  attack: (from: TerritoryId, to: TerritoryId, armies: number) => void;
  moveArmies: (from: TerritoryId, to: TerritoryId, count: number) => void;
  endTurn: () => void;
  saveGame: () => void;
  hasSavedGame: () => boolean;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      startGame: (playerCount) => {
        const game = createInitialGameState(playerCount);
        set({ game });
      },

      resetGame: () => set({ game: null }),

      advancePhase: () => {
        const { game } = get();
        if (!game) return;
        const next = advancePhase(game);
        const victoryCheck = checkVictory(next);
        set({
          game: victoryCheck.hasWinner
            ? { ...next, winner: victoryCheck.winnerId, log: [...next.log, victoryCheck.reason ?? ""] }
            : next,
        });
      },

      attack: (from, to, armies) => {
        const { game } = get();
        if (!game) return;

        const fromT = game.territories.find((t) => t.id === from);
        const toT = game.territories.find((t) => t.id === to);
        if (!fromT || !toT) return;

        const { valid, reason } = canAttack(fromT, toT, game.currentPlayerId);
        if (!valid) {
          set({ game: { ...game, log: [...game.log, `Ataque inválido: ${reason}`] } });
          return;
        }

        const result = resolveCombat(armies, toT.armies);
        const territories = game.territories.map((t) => {
          if (t.id === from) return { ...t, armies: t.armies - result.attackerLosses };
          if (t.id === to) {
            const remaining = t.armies - result.defenderLosses;
            if (result.attackerWon) {
              return { ...t, armies: armies - result.attackerLosses, ownerId: game.currentPlayerId };
            }
            return { ...t, armies: Math.max(1, remaining) };
          }
          return t;
        });

        const attacker = game.players.find((p) => p.id === game.currentPlayerId);
        const logEntry = result.attackerWon
          ? `${attacker?.name} conquistou ${toT.name}!`
          : `Ataque de ${attacker?.name} em ${toT.name} foi repelido.`;

        const next = { ...game, territories, log: [...game.log, logEntry] };
        const victoryCheck = checkVictory(next);
        set({
          game: victoryCheck.hasWinner
            ? { ...next, winner: victoryCheck.winnerId, log: [...next.log, victoryCheck.reason ?? ""] }
            : next,
        });
      },

      moveArmies: (from, to, count) => {
        const { game } = get();
        if (!game) return;

        const fromT = game.territories.find((t) => t.id === from);
        const toT = game.territories.find((t) => t.id === to);
        if (!fromT || !toT) return;

        const { valid, reason } = canMove(fromT, toT, game.currentPlayerId, count);
        if (!valid) {
          set({ game: { ...game, log: [...game.log, `Movimento inválido: ${reason}`] } });
          return;
        }

        const territories = game.territories.map((t) => {
          if (t.id === from) return { ...t, armies: t.armies - count };
          if (t.id === to) return { ...t, armies: t.armies + count };
          return t;
        });

        set({ game: { ...game, territories } });
      },

      endTurn: () => {
        const { game } = get();
        if (!game) return;
        const next = advancePhase({ ...game, phase: "end_turn" });
        set({ game: next });
      },

      saveGame: () => {
        set((state) => ({
          game: state.game ? { ...state.game, savedAt: new Date().toISOString() } : null,
        }));
      },

      hasSavedGame: () => {
        return get().game !== null;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ game: state.game }),
    }
  )
);
