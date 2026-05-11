
/**
 * game-core/actions.ts
 *
 * Pure action functions for player turns.
 * Every function validates preconditions and returns a result object.
 * No React imports, no side effects.
 */

import type { GameState, TerritoryId, PlayerId, CardId } from "@/types";
import { TROOP_LIMITS } from "@/types";
import { recordAction } from "./turn";
import { applyFaithChange } from "./faith";

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ActionResult {
  valid: boolean;
  reason?: string;
  state: GameState;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTurn(state: GameState, playerId: PlayerId): string | null {
  if (state.turno.jogadorAtualId !== playerId) return "Não é seu turno.";
  if (state.turno.acoesRestantes <= 0) return "Sem ações restantes.";
  return null;
}

/** Faith ≤ 39 is considered "difficult" — reduced gain for safe option, increased for quiz */
function isFaithDifficult(faith: number): boolean {
  return faith <= 39;
}

// ─── Recruit Troops ───────────────────────────────────────────────────────────

/**
 * Recrutar tropas:
 * - Costs 1 provisão
 * - Adds 2 troops to the territory (or fewer if at limit)
 * - Costs 1 action
 */
export function recruitTroops(
  state: GameState,
  playerId: PlayerId,
  territoryId: TerritoryId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const territory = state.territories.find((t) => t.id === territoryId);
  const player = state.players.find((p) => p.id === playerId);
  if (!territory || !player) {
    return { valid: false, reason: "Território ou jogador não encontrado.", state };
  }
  if (territory.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla este território.", state };
  }
  if (player.resources.provisao < 1) {
    return { valid: false, reason: "Sem provisão suficiente. Custa 1 provisão.", state };
  }

  const limit = TROOP_LIMITS[territory.type];
  if (territory.tropasAtuais >= limit) {
    return {
      valid: false,
      reason: `Limite de tropas atingido em ${territory.name} (máx ${limit}).`,
      state,
    };
  }

  const toAdd = Math.min(2, limit - territory.tropasAtuais);
  const description = `${player.name} recrutou ${toAdd} tropa(s) em ${territory.name}.`;

  const updatedState = recordAction(
    {
      ...state,
      territories: state.territories.map((t) =>
        t.id === territoryId ? { ...t, tropasAtuais: t.tropasAtuais + toAdd } : t
      ),
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, provisao: p.resources.provisao - 1 } }
          : p
      ),
      log: [...state.log, description],
    },
    "RECRUTAR",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Move Troops ──────────────────────────────────────────────────────────────

/**
 * Mover tropas:
 * - Both territories must belong to the player
 * - Territories must be adjacent
 * - Origin must keep at least 1 troop
 * - Destination must not exceed its troop limit
 * - Costs 1 action
 */
export function moveTroops(
  state: GameState,
  playerId: PlayerId,
  fromId: TerritoryId,
  toId: TerritoryId,
  count: number
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const fromT = state.territories.find((t) => t.id === fromId);
  const toT = state.territories.find((t) => t.id === toId);
  const player = state.players.find((p) => p.id === playerId);

  if (!fromT || !toT || !player) {
    return { valid: false, reason: "Território não encontrado.", state };
  }
  if (fromT.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla a origem.", state };
  }
  if (toT.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla o destino.", state };
  }
  if (!fromT.connections.includes(toId)) {
    return { valid: false, reason: "Territórios não são adjacentes.", state };
  }
  if (count < 1) {
    return { valid: false, reason: "Mova ao menos 1 tropa.", state };
  }
  if (count >= fromT.tropasAtuais) {
    return {
      valid: false,
      reason: "A origem deve ficar com ao menos 1 tropa.",
      state,
    };
  }
  const destLimit = TROOP_LIMITS[toT.type];
  if (toT.tropasAtuais + count > destLimit) {
    return {
      valid: false,
      reason: `Destino ficaria acima do limite (máx ${destLimit}).`,
      state,
    };
  }

  const description = `${player.name} moveu ${count} tropa(s) de ${fromT.name} para ${toT.name}.`;

  const updatedState = recordAction(
    {
      ...state,
      territories: state.territories.map((t) => {
        if (t.id === fromId) return { ...t, tropasAtuais: t.tropasAtuais - count };
        if (t.id === toId) return { ...t, tropasAtuais: t.tropasAtuais + count };
        return t;
      }),
      turno: {
        ...state.turno,
        territoriosMovidosNesteturno: [
          ...state.turno.territoriosMovidosNesteturno,
          fromId,
        ],
      },
      log: [...state.log, description],
    },
    "MOVER_TROPAS",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Strengthen Faith ─────────────────────────────────────────────────────────

/**
 * Fortalecer fé:
 *
 * Opção segura:
 *   - faith ≤ 39 (difícil): +5
 *   - faith > 39: +10
 *
 * Opção quiz:
 *   - Correct + difficult: +10
 *   - Correct + normal: +15
 *   - Wrong: -5
 *
 * Costs 1 action.
 */
export function strengthenFaith(
  state: GameState,
  playerId: PlayerId,
  territoryId: TerritoryId,
  option: "safe" | "quiz",
  quizCorrect?: boolean
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const territory = state.territories.find((t) => t.id === territoryId);
  const player = state.players.find((p) => p.id === playerId);

  if (!territory || !player) {
    return { valid: false, reason: "Território não encontrado.", state };
  }
  if (territory.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla este território.", state };
  }

  const difficult = isFaithDifficult(territory.feAtual);
  let delta = 0;
  let description = "";

  if (option === "safe") {
    delta = difficult ? 5 : 10;
    const suffix = difficult ? "(território difícil)" : "";
    description = `${player.name} fortaleceu a fé em ${territory.name} +${delta} ${suffix}.`.trim();
  } else {
    if (quizCorrect) {
      delta = difficult ? 10 : 15;
      description = `${player.name} respondeu certo! Fé em ${territory.name} +${delta}.`;
    } else {
      delta = -5;
      description = `${player.name} errou a questão. Fé em ${territory.name} -5.`;
    }
  }

  const updatedTerritory = applyFaithChange(territory, delta);

  const updatedState = recordAction(
    {
      ...state,
      territories: state.territories.map((t) =>
        t.id === territoryId ? updatedTerritory : t
      ),
      log: [...state.log, description],
    },
    "FORTALECER_FE",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Discard Card ─────────────────────────────────────────────────────────────

/**
 * Descartar carta:
 * - Player must have the card in hand
 * - Costs 1 action
 */
export function discardCard(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { valid: false, reason: "Jogador não encontrado.", state };

  const card = player.cartasNaMao.find((c) => c.id === cardId);
  if (!card) {
    return { valid: false, reason: "Carta não encontrada na mão.", state };
  }

  const description = `${player.name} descartou "${card.name}".`;

  const updatedState = recordAction(
    {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, cartasNaMao: p.cartasNaMao.filter((c) => c.id !== cardId) }
          : p
      ),
      descarte: [...state.descarte, card],
      log: [...state.log, description],
    },
    "DESCARTAR_CARTA",
    description
  );

  return { valid: true, state: updatedState };
}
