
import type { GameState, PlayerId } from "@/types";

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

  for (const player of state.players) {
    const controlled = state.territories.filter(
      (t) => t.ownerId === player.id
    ).length;

    // Dominion victory: control >60% of all territories
    if (controlled / totalTerritories > 0.6) {
      return {
        hasWinner: true,
        winnerId: player.id,
        reason: `${player.name} dominou o mapa com ${controlled} territórios!`,
      };
    }

    // Elimination: only one player remains with territories
    const activePlayers = state.players.filter((p) =>
      state.territories.some((t) => t.ownerId === p.id)
    );
    if (activePlayers.length === 1) {
      const last = activePlayers[0];
      return {
        hasWinner: true,
        winnerId: last.id,
        reason: `${last.name} eliminou todos os adversários!`,
      };
    }
  }

  // Turn limit (optional: 50 rounds → most territories wins)
  if (state.turn > 50) {
    const sorted = [...state.players].sort((a, b) => {
      const aCtrl = state.territories.filter((t) => t.ownerId === a.id).length;
      const bCtrl = state.territories.filter((t) => t.ownerId === b.id).length;
      return bCtrl - aCtrl;
    });
    return {
      hasWinner: true,
      winnerId: sorted[0].id,
      reason: `Limite de rodadas atingido. ${sorted[0].name} vence por territórios!`,
    };
  }

  return { hasWinner: false, winnerId: null, reason: null };
}
