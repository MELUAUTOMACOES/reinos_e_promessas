
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, NewGameConfig, TerritoryId, PlayerId, CardId } from "@/types";
import {
  createNewGame,
  startTurn,
  endTurn,
  advancePhase,
  checkVictory,
  resolveCombat,
  canAttack,
  faithOnConquest,
  recruitTroops,
  moveTroops,
  strengthenFaith,
  discardCard,
} from "@/game-core";

const STORAGE_KEY = "reinos-promessas-save";

// ─── Store interface ──────────────────────────────────────────────────────────

interface GameStore {
  game: GameState | null;

  startGame: (config: NewGameConfig) => void;
  resetGame: () => void;
  nextPhase: () => void;
  finishTurn: () => void;
  saveGame: () => void;
  hasSavedGame: () => boolean;

  // ── Player actions ──────────────────────────────────────────────────────
  recruitTroopsAction: (territoryId: TerritoryId) => { valid: boolean; reason?: string };
  moveTroopsAction: (fromId: TerritoryId, toId: TerritoryId, count: number) => { valid: boolean; reason?: string };
  strengthenFaithAction: (territoryId: TerritoryId, option: "safe" | "quiz", quizCorrect?: boolean) => { valid: boolean; reason?: string };
  discardCardAction: (cardId: CardId) => { valid: boolean; reason?: string };

  // ── Combat (future) ─────────────────────────────────────────────────────
  attack: (from: TerritoryId, to: TerritoryId, tropas: number) => void;
}

// ─── Victory helper ───────────────────────────────────────────────────────────

function applyVictoryCheck(state: GameState): GameState {
  const check = checkVictory(state);
  if (check.hasWinner) {
    return {
      ...state,
      vencedor: check.winnerId,
      log: [...state.log, check.reason ?? ""],
    };
  }
  return state;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      startGame: (config) => {
        const fresh = createNewGame(config);
        set({ game: startTurn(fresh) });
      },

      resetGame: () => set({ game: null }),

      nextPhase: () => {
        const { game } = get();
        if (!game || game.vencedor) return;
        set({ game: applyVictoryCheck(advancePhase(game)) });
      },

      finishTurn: () => {
        const { game } = get();
        if (!game || game.vencedor) return;
        set({ game: applyVictoryCheck(endTurn(game)) });
      },

      saveGame: () => {
        set((s) => ({
          game: s.game ? { ...s.game, savedAt: new Date().toISOString() } : null,
        }));
      },

      hasSavedGame: () => get().game !== null,

      // ── recruitTroopsAction ─────────────────────────────────────────────
      recruitTroopsAction: (territoryId) => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = recruitTroops(game, game.turno.jogadorAtualId, territoryId);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── moveTroopsAction ────────────────────────────────────────────────
      moveTroopsAction: (fromId, toId, count) => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = moveTroops(game, game.turno.jogadorAtualId, fromId, toId, count);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── strengthenFaithAction ───────────────────────────────────────────
      strengthenFaithAction: (territoryId, option, quizCorrect) => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = strengthenFaith(game, game.turno.jogadorAtualId, territoryId, option, quizCorrect);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── discardCardAction ───────────────────────────────────────────────
      discardCardAction: (cardId) => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = discardCard(game, game.turno.jogadorAtualId, cardId);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── attack (future: combat phase) ───────────────────────────────────
      attack: (fromId, toId, tropas) => {
        const { game } = get();
        if (!game || game.vencedor) return;

        const fromT = game.territories.find((t) => t.id === fromId);
        const toT = game.territories.find((t) => t.id === toId);
        if (!fromT || !toT) return;

        const { valid, reason } = canAttack(fromT, toT, game.turno.jogadorAtualId);
        if (!valid) {
          set({ game: { ...game, log: [...game.log, `Ataque inválido: ${reason}`] } });
          return;
        }

        const result = resolveCombat(tropas, toT);
        const territories = game.territories.map((t) => {
          if (t.id === fromId) return { ...t, tropasAtuais: Math.max(1, t.tropasAtuais - result.atacantePerdas) };
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
          ? `${attacker?.name} conquistou ${toT.name}!`
          : `Ataque de ${attacker?.name} em ${toT.name} foi repelido.`;

        set({
          game: applyVictoryCheck({
            ...game,
            territories,
            turno: { ...game.turno, atacouNesteturno: true },
            log: [...game.log, logEntry],
          }),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      partialize: (s) => ({ game: s.game }),
      migrate: (_s, version) => (version < 3 ? { game: null } : (_s as { game: GameState | null })),
    }
  )
);
