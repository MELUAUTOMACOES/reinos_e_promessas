
import type { GameState, PlayerId, GameMode } from "@/types";
import { GAME_MODES } from "@/types";

export interface VictoryCheck {
  hasWinner: boolean;
  winnerId: PlayerId | null;
  reason: string | null;
}

/**
 * Checks all victory conditions after each turn.
 * Returns null if no winner yet. Pure function.
 */
export function checkVictory(state: GameState): VictoryCheck {
  const totalTerritories = state.territories.length;
  const legadoMaximo = GAME_MODES[state.mode].legadoMaximo;

  for (const player of state.players) {
    const controlled = state.territories.filter(
      (t) => t.donoAtual === player.id
    ).length;

    // Legacy victory
    if (player.resources.legado >= legadoMaximo) {
      return {
        hasWinner: true,
        winnerId: player.id,
        reason: `${player.name} atingiu ${legadoMaximo} pontos de Legado!`,
      };
    }

    // Dominion victory: control >60% of all territories
    if (controlled / totalTerritories > 0.6) {
      return {
        hasWinner: true,
        winnerId: player.id,
        reason: `${player.name} dominou o mapa com ${controlled} territórios!`,
      };
    }
  }

  // Elimination: only one player remains with territories
  const activePlayers = state.players.filter((p) =>
    state.territories.some((t) => t.donoAtual === p.id)
  );
  if (activePlayers.length === 1) {
    const last = activePlayers[0];
    return {
      hasWinner: true,
      winnerId: last.id,
      reason: `${last.name} eliminou todos os adversários!`,
    };
  }

  // Turn limit (50 rounds → most legacy wins)
  if (state.turno.rodada > 50) {
    const sorted = [...state.players].sort(
      (a, b) => b.resources.legado - a.resources.legado
    );
    return {
      hasWinner: true,
      winnerId: sorted[0].id,
      reason: `Limite de rodadas atingido. ${sorted[0].name} vence por Legado!`,
    };
  }

  return { hasWinner: false, winnerId: null, reason: null };
}
