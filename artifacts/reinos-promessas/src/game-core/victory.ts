
import type { GameState, PlayerId, GameMode, SecretObjective } from "@/types";
import { GAME_MODES } from "@/types";
import { SECRET_OBJECTIVES } from "@/game-data/objectives";
import { checkObjectiveCompleted, checkLegacyVictory } from "./objectives";

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

    // 1. Secret Objective Victory
    if (player.objetivoSecretoId) {
      const objective = SECRET_OBJECTIVES.find((obj) => obj.id === player.objetivoSecretoId);
      if (objective && checkObjectiveCompleted(state, player.id, objective)) {
        return {
          hasWinner: true,
          winnerId: player.id,
          reason: `${player.name} completou o objetivo secreto: ${objective.name}!`,
        };
      }
    }

    // 2. Legacy + Territory Victory
    if (checkLegacyVictory(state, player.id)) {
      const legacyRequired = state.mode === "rapido" ? 100 : 150;
      return {
        hasWinner: true,
        winnerId: player.id,
        reason: `${player.name} atingiu ${legacyRequired} de Legado e controle territorial suficiente!`,
      };
    }

    // 3. Legacy victory (old system - mantido como fallback)
    if (player.resources.legado >= legadoMaximo) {
      return {
        hasWinner: true,
        winnerId: player.id,
        reason: `${player.name} atingiu ${legadoMaximo} pontos de Legado!`,
      };
    }

    // 4. Dominion victory: control >60% of all territories
    if (controlled / totalTerritories > 0.6) {
      return {
        hasWinner: true,
        winnerId: player.id,
        reason: `${player.name} dominou o mapa com ${controlled} territórios!`,
      };
    }
  }

  // 5. Elimination: only one player remains with territories
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

  // 6. Turn limit (50 rounds → most legacy wins)
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
