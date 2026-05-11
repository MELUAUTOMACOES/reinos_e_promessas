
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, NewGameConfig, TerritoryId, PlayerId } from "@/types";
import {
  createNewGame,
  startTurn,
  endTurn,
  advancePhase,
  recordAction,
  checkVictory,
  resolveCombat,
  canAttack,
  canMove,
  faithOnConquest,
} from "@/game-core";

const STORAGE_KEY = "reinos-promessas-save";

// ─── Store interface ──────────────────────────────────────────────────────────

interface GameStore {
  game: GameState | null;

  /** Start a new game from a full NewGameConfig */
  startGame: (config: NewGameConfig) => void;

  /** Wipe the current save */
  resetGame: () => void;

  /** Advance to the next turn phase (applies endTurn if at fim_turno) */
  nextPhase: () => void;

  /** Immediately end the current player's turn */
  finishTurn: () => void;

  /** Attack from one territory to another */
  attack: (from: TerritoryId, to: TerritoryId, tropas: number) => void;

  /** Move troops between friendly territories */
  moveArmies: (from: TerritoryId, to: TerritoryId, count: number) => void;

  /** Persist the current state to localStorage */
  saveGame: () => void;

  /** Returns true if there is an in-progress game */
  hasSavedGame: () => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      // ── startGame ─────────────────────────────────────────────────────────
      startGame: (config) => {
        const fresh = createNewGame(config);
        // Apply first player's production immediately (producao phase)
        const withProduction = startTurn(fresh);
        set({ game: withProduction });
      },

      // ── resetGame ─────────────────────────────────────────────────────────
      resetGame: () => set({ game: null }),

      // ── nextPhase ─────────────────────────────────────────────────────────
      nextPhase: () => {
        const { game } = get();
        if (!game || game.vencedor) return;

        const next = advancePhase(game);
        const victoryCheck = checkVictory(next);

        set({
          game: victoryCheck.hasWinner
            ? {
                ...next,
                vencedor: victoryCheck.winnerId,
                log: [...next.log, victoryCheck.reason ?? ""],
              }
            : next,
        });
      },

      // ── finishTurn ────────────────────────────────────────────────────────
      finishTurn: () => {
        const { game } = get();
        if (!game || game.vencedor) return;

        const next = endTurn(game);
        const victoryCheck = checkVictory(next);

        set({
          game: victoryCheck.hasWinner
            ? {
                ...next,
                vencedor: victoryCheck.winnerId,
                log: [...next.log, victoryCheck.reason ?? ""],
              }
            : next,
        });
      },

      // ── attack ────────────────────────────────────────────────────────────
      attack: (fromId, toId, tropas) => {
        const { game } = get();
        if (!game || game.vencedor) return;

        const fromT = game.territories.find((t) => t.id === fromId);
        const toT = game.territories.find((t) => t.id === toId);
        if (!fromT || !toT) return;

        const { valid, reason } = canAttack(fromT, toT, game.turno.jogadorAtualId);
        if (!valid) {
          set({
            game: {
              ...game,
              log: [...game.log, `Ataque inválido: ${reason}`],
            },
          });
          return;
        }

        const result = resolveCombat(tropas, toT);
        const territories = game.territories.map((t) => {
          if (t.id === fromId) {
            return { ...t, tropasAtuais: Math.max(1, t.tropasAtuais - result.atacantePerdas) };
          }
          if (t.id === toId) {
            if (result.atacanteVenceu) {
              return faithOnConquest(
                { ...t, tropasAtuais: tropas - result.atacantePerdas },
                game.turno.jogadorAtualId
              );
            }
            return { ...t, tropasAtuais: Math.max(1, t.tropasAtuais - result.defensorPerdas) };
          }
          return t;
        });

        const attacker = game.players.find((p) => p.id === game.turno.jogadorAtualId);
        const logEntry = result.atacanteVenceu
          ? `${attacker?.name} conquistou ${toT.name}! (${tropas - result.atacantePerdas} tropas restantes)`
          : `Ataque de ${attacker?.name} em ${toT.name} foi repelido.`;

        let next = recordAction(
          { ...game, territories, log: [...game.log, logEntry] },
          "ATACAR",
          logEntry
        );
        next = { ...next, turno: { ...next.turno, atacouNesteturno: true } };

        const victoryCheck = checkVictory(next);
        set({
          game: victoryCheck.hasWinner
            ? {
                ...next,
                vencedor: victoryCheck.winnerId,
                log: [...next.log, victoryCheck.reason ?? ""],
              }
            : next,
        });
      },

      // ── moveArmies ────────────────────────────────────────────────────────
      moveArmies: (fromId, toId, count) => {
        const { game } = get();
        if (!game || game.vencedor) return;

        const fromT = game.territories.find((t) => t.id === fromId);
        const toT = game.territories.find((t) => t.id === toId);
        if (!fromT || !toT) return;

        const { valid, reason } = canMove(fromT, toT, game.turno.jogadorAtualId, count);
        if (!valid) {
          set({
            game: {
              ...game,
              log: [...game.log, `Movimento inválido: ${reason}`],
            },
          });
          return;
        }

        const territories = game.territories.map((t) => {
          if (t.id === fromId) return { ...t, tropasAtuais: t.tropasAtuais - count };
          if (t.id === toId) return { ...t, tropasAtuais: t.tropasAtuais + count };
          return t;
        });

        const logEntry = `${game.players.find((p) => p.id === game.turno.jogadorAtualId)?.name} moveu ${count} tropa(s) de ${fromT.name} para ${toT.name}.`;

        const next = recordAction(
          {
            ...game,
            territories,
            turno: {
              ...game.turno,
              territoriosMovidosNesteturno: [
                ...game.turno.territoriosMovidosNesteturno,
                fromId,
              ],
            },
            log: [...game.log, logEntry],
          },
          "MOVER_TROPAS",
          logEntry
        );

        set({ game: next });
      },

      // ── saveGame ──────────────────────────────────────────────────────────
      saveGame: () => {
        set((state) => ({
          game: state.game
            ? { ...state.game, savedAt: new Date().toISOString() }
            : null,
        }));
      },

      // ── hasSavedGame ──────────────────────────────────────────────────────
      hasSavedGame: () => get().game !== null,
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      partialize: (state) => ({ game: state.game }),
      migrate: (_persistedState, version) => {
        if (version < 3) return { game: null };
        return _persistedState as { game: GameState | null };
      },
    }
  )
);
