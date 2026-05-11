
import type { GameState, TurnPhase, PlayerId } from "@/types";

const PHASE_ORDER: TurnPhase[] = [
  "producao",
  "cartas",
  "movimento",
  "combate",
  "fim_turno",
];

/**
 * Advances the game to the next phase, or to the next player's turn.
 * Pure function — returns a new GameState snapshot.
 */
export function advancePhase(state: GameState): GameState {
  const currentIndex = PHASE_ORDER.indexOf(state.turno.fase);

  if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) {
    return advanceToNextPlayer(state);
  }

  return {
    ...state,
    turno: { ...state.turno, fase: PHASE_ORDER[currentIndex + 1] },
  };
}

function advanceToNextPlayer(state: GameState): GameState {
  const currentPlayerIndex = state.players.findIndex(
    (p) => p.id === state.turno.jogadorAtualId
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextPlayerIndex];
  const isNewRound = nextPlayerIndex === 0;

  return {
    ...state,
    turno: {
      rodada: isNewRound ? state.turno.rodada + 1 : state.turno.rodada,
      fase: "producao",
      jogadorAtualId: nextPlayer.id,
      territoriosMovidosNesteturno: [],
      atacouNesteturno: false,
    },
    log: [
      ...state.log,
      `${isNewRound ? `Rodada ${state.turno.rodada + 1} começa. ` : ""}Vez de ${nextPlayer.name}.`,
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
