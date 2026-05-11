
import type { GameState, GamePhase, PlayerId } from "@/types";

const PHASE_ORDER: GamePhase[] = [
  "production",
  "cards",
  "movement",
  "combat",
  "end_turn",
];

/**
 * Advances the game to the next phase, or to the next player's turn.
 * Pure function — returns a new GameState snapshot.
 */
export function advancePhase(state: GameState): GameState {
  const currentIndex = PHASE_ORDER.indexOf(state.phase);

  if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) {
    return advanceToNextPlayer(state);
  }

  return {
    ...state,
    phase: PHASE_ORDER[currentIndex + 1],
  };
}

function advanceToNextPlayer(state: GameState): GameState {
  const currentPlayerIndex = state.players.findIndex(
    (p) => p.id === state.currentPlayerId
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextPlayerIndex];
  const isNewRound = nextPlayerIndex === 0;

  return {
    ...state,
    phase: "production",
    currentPlayerId: nextPlayer.id,
    turn: isNewRound ? state.turn + 1 : state.turn,
    log: [
      ...state.log,
      `Turno ${state.turn}${isNewRound ? ` → Rodada ${state.turn + 1}` : ""}: vez de ${nextPlayer.name}`,
    ],
  };
}

/**
 * Returns the next player ID in rotation.
 */
export function getNextPlayerId(
  currentId: PlayerId,
  players: GameState["players"]
): PlayerId {
  const idx = players.findIndex((p) => p.id === currentId);
  return players[(idx + 1) % players.length].id;
}
