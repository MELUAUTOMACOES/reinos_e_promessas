
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, NewGameConfig, TerritoryId, PlayerId, CardId } from "@/types";
import {
  createNewGame,
  startTurn,
  endTurn,
  advancePhase,
  checkVictory,
} from "@/game-core";
import {
  recruitTroops,
  moveTroops,
  strengthenFaith,
  discardCard,
  attackTerritory,
  type AttackResult,
  influenceTerritory,
  type InfluenceActionResult,
  buyRandomCardAction,
  buyMarketCardAction,
  activateCharacter,
} from "@/game-core/actions";
import { decideBotAction } from "@/game-core/bot";

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

  // ── Combat ──────────────────────────────────────────────────────────────
  attackTerritoryAction: (fromId: TerritoryId, toId: TerritoryId, tropasUsadas: number) => AttackResult;

  // ── Influence ───────────────────────────────────────────────────────────
  influenceTerritoryAction: (fromId: TerritoryId, toId: TerritoryId, influencia: number, ouro: number) => InfluenceActionResult;

  // ── Cards ───────────────────────────────────────────────────────────────
  buyRandomCard: () => { valid: boolean; reason?: string };
  buyMarketCard: (cardId: CardId) => { valid: boolean; reason?: string };
  activateCharacterAction: (cardId: CardId) => { valid: boolean; reason?: string };

  // ── Bot ─────────────────────────────────────────────────────────────────
  executeBotAction: () => void;
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

      // ── attackTerritoryAction ───────────────────────────────────────────
      attackTerritoryAction: (fromId, toId, tropasUsadas) => {
        const { game } = get();
        if (!game || game.vencedor) {
          return { valid: false, reason: "Partida encerrada.", state: game! };
        }

        const result = attackTerritory(game, game.turno.jogadorAtualId, fromId, toId, tropasUsadas);
        if (result.valid) {
          set({ game: applyVictoryCheck(result.state) });
        }
        return result;
      },

      // ── influenceTerritoryAction ────────────────────────────────────────
      influenceTerritoryAction: (fromId, toId, influencia, ouro) => {
        const { game } = get();
        if (!game || game.vencedor) {
          return { valid: false, reason: "Partida encerrada.", state: game! };
        }

        const result = influenceTerritory(game, game.turno.jogadorAtualId, fromId, toId, influencia, ouro);
        if (result.valid) {
          set({ game: applyVictoryCheck(result.state) });
        }
        return result;
      },

      // ── buyRandomCard ───────────────────────────────────────────────────
      buyRandomCard: () => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = buyRandomCardAction(game, game.turno.jogadorAtualId);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── buyMarketCard ───────────────────────────────────────────────────
      buyMarketCard: (cardId) => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = buyMarketCardAction(game, game.turno.jogadorAtualId, cardId);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── activateCharacterAction ─────────────────────────────────────────
      activateCharacterAction: (cardId) => {
        const { game } = get();
        if (!game || game.vencedor) return { valid: false, reason: "Partida encerrada." };

        const result = activateCharacter(game, game.turno.jogadorAtualId, cardId);
        if (result.valid) set({ game: applyVictoryCheck(result.state) });
        return { valid: result.valid, reason: result.reason };
      },

      // ── executeBotAction ─────────────────────────────────────────────────
      executeBotAction: () => {
        const { game } = get();
        if (!game || game.vencedor) return;
        const pid = game.turno.jogadorAtualId;
        const player = game.players.find(p => p.id === pid);
        if (!player || !player.isBot) return;
        if (game.turno.acoesRestantes <= 0) return;

        const decision = decideBotAction(game, pid);

        switch (decision.type) {
          case "recruit": {
            const tid = decision.data.territoryId as TerritoryId;
            const r = recruitTroops(game, pid, tid);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "move": {
            const from = decision.data.fromId as TerritoryId;
            const to = decision.data.toId as TerritoryId;
            const cnt = decision.data.count as number;
            const r = moveTroops(game, pid, from, to, cnt);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "attack": {
            const from = decision.data.fromId as TerritoryId;
            const to = decision.data.toId as TerritoryId;
            const tropas = decision.data.tropas as number;
            const r = attackTerritory(game, pid, from, to, tropas);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "faith": {
            const tid = decision.data.territoryId as TerritoryId;
            const r = strengthenFaith(game, pid, tid, "safe");
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "influence": {
            const from = decision.data.fromId as TerritoryId;
            const to = decision.data.toId as TerritoryId;
            const inf = decision.data.influencia as number;
            const ouro = decision.data.ouro as number;
            const r = influenceTerritory(game, pid, from, to, inf, ouro);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "buyRandom": {
            const r = buyRandomCardAction(game, pid);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "buyMarket": {
            const cid = decision.data.cardId as CardId;
            const r = buyMarketCardAction(game, pid, cid);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "activateChar": {
            const cid = decision.data.cardId as CardId;
            const r = activateCharacter(game, pid, cid);
            if (r.valid) set({ game: applyVictoryCheck(r.state) });
            break;
          }
          case "pass":
          default:
            set({ game: applyVictoryCheck(advancePhase(game)) });
            break;
        }
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
