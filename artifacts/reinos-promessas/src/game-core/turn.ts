
import type { GameState, TurnPhase, PlayerId, TurnState, TurnAction, ActionType } from "@/types";
import { applyProduction } from "./resources";
import { decayFaithTowardBase } from "./faith";

const PHASE_ORDER: TurnPhase[] = [
  "producao",
  "cartas",
  "movimento",
  "combate",
  "fim_turno",
];

const ACTIONS_PER_TURN = 3;

// ─── startTurn ────────────────────────────────────────────────────────────────

/**
 * Begins the current player's turn:
 * 1. Applies production for the current player.
 * 2. Resets per-turn state (actions, move history, attack flag).
 * 3. Sets phase to "producao".
 *
 * Pure function — no side effects.
 */
export function startTurn(state: GameState): GameState {
  const player = state.players.find((p) => p.id === state.turno.jogadorAtualId);
  if (!player) return state;

  const { updatedPlayer, updatedTerritories, log: prodLog } = applyProduction(
    player,
    state.territories,
    state.regions
  );

  const players = state.players.map((p) =>
    p.id === updatedPlayer.id ? updatedPlayer : p
  );

  const newLog = [
    ...state.log,
    `── Rodada ${state.turno.rodada} · ${player.name} ──`,
    ...prodLog,
  ];

  return {
    ...state,
    players,
    territories: updatedTerritories,
    turno: {
      ...state.turno,
      fase: "producao",
      acoesRestantes: ACTIONS_PER_TURN,
      territoriosMovidosNesteturno: [],
      atacouNesteturno: false,
      historicoAcoes: [],
    },
    log: newLog,
  };
}

// ─── endTurn ─────────────────────────────────────────────────────────────────

/**
 * Ends the current player's turn:
 * 1. Decays faith on all territories toward their base value.
 * 2. Advances to the next player (wrapping around, incrementing rodada if needed).
 * 3. Calls startTurn for the next player.
 *
 * Pure function — no side effects.
 */
export function endTurn(state: GameState): GameState {
  // 1. Decay faith on all territories
  const territories = state.territories.map(decayFaithTowardBase);

  // 2. Advance to next player
  const nextState = advanceToNextPlayer({ ...state, territories });

  // 3. Start the new player's turn (applies production)
  return startTurn(nextState);
}

// ─── advancePhase ─────────────────────────────────────────────────────────────

/**
 * Advances the game to the next turn phase.
 * If already at "fim_turno", delegates to endTurn.
 *
 * Pure function — no side effects.
 */
export function advancePhase(state: GameState): GameState {
  const currentIndex = PHASE_ORDER.indexOf(state.turno.fase);

  if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) {
    return endTurn(state);
  }

  return {
    ...state,
    turno: { ...state.turno, fase: PHASE_ORDER[currentIndex + 1] },
  };
}

// ─── recordAction ─────────────────────────────────────────────────────────────

/**
 * Records an action in the turn history and decrements acoesRestantes.
 * Pure function.
 */
export function recordAction(
  state: GameState,
  type: ActionType,
  description: string
): GameState {
  const action: TurnAction = { type, description, timestamp: Date.now() };
  return {
    ...state,
    turno: {
      ...state.turno,
      acoesRestantes: Math.max(0, state.turno.acoesRestantes - 1),
      historicoAcoes: [...state.turno.historicoAcoes, action],
    },
  };
}

// ─── Internals ────────────────────────────────────────────────────────────────

function advanceToNextPlayer(state: GameState): GameState {
  const currentIndex = state.turno.indiceJogadorAtual;
  const nextIndex = (currentIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextIndex];
  const isNewRound = nextIndex === 0;

  return {
    ...state,
    turno: {
      rodada: isNewRound ? state.turno.rodada + 1 : state.turno.rodada,
      fase: "producao",
      jogadorAtualId: nextPlayer.id,
      indiceJogadorAtual: nextIndex,
      acoesRestantes: ACTIONS_PER_TURN,
      territoriosMovidosNesteturno: [],
      atacouNesteturno: false,
      historicoAcoes: [],
    },
    log: [
      ...state.log,
      isNewRound
        ? `Rodada ${state.turno.rodada + 1} começa. Vez de ${nextPlayer.name}.`
        : `Vez de ${nextPlayer.name}.`,
    ],
  };
}

// ─── Legacy helper ────────────────────────────────────────────────────────────

/** Returns the next player ID in rotation. */
export function getNextPlayerId(
  currentId: PlayerId,
  players: GameState["players"]
): PlayerId {
  const idx = players.findIndex((p) => p.id === currentId);
  return players[(idx + 1) % players.length].id;
}
