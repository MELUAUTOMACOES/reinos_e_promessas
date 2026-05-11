
import type { GameState, PlayerId, SecretObjective } from "@/types";

/**
 * Valida se um jogador completou seu objetivo secreto.
 */
export function checkObjectiveCompleted(
  state: GameState,
  playerId: PlayerId,
  objective: SecretObjective
): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  const playerTerritories = state.territories.filter((t) => t.donoAtual === playerId);

  switch (objective.conditionKey) {
    case "REINO_DAVI": {
      const required = objective.conditionData?.territories || [];
      const hasAllTerritories = required.every((tId) =>
        playerTerritories.some((t) => t.id === tId)
      );
      
      if (!hasAllTerritories) return false;

      const jerusalem = state.territories.find((t) => t.id === "jerusalem" && t.donoAtual === playerId);
      return jerusalem ? jerusalem.feAtual >= (objective.conditionData?.faithRequired || 60) : false;
    }

    case "CAMINHO_EXODO": {
      const required = objective.conditionData?.territories || [];
      const hasAllTerritories = required.every((tId) =>
        playerTerritories.some((t) => t.id === tId)
      );

      if (!hasAllTerritories) return false;

      const hasResources = player.resources.provisao >= (objective.conditionData?.resourcesRequired || 8);
      return hasResources;
    }

    case "DOMINIO_ROTAS": {
      const required = objective.conditionData?.territories || [];
      return required.every((tId) =>
        playerTerritories.some((t) => t.id === tId)
      );
    }

    case "REINO_FIEL": {
      const faithLevel = objective.conditionData?.faithLevel || 70;
      const territoriesWithHighFaith = playerTerritories.filter(
        (t) => t.feAtual >= faithLevel
      );

      if (territoriesWithHighFaith.length < (objective.conditionData?.territoryCount || 5)) {
        return false;
      }

      const hasSacredCity = playerTerritories.some((t) => t.type === "sagrado");
      return hasSacredCity;
    }

    case "IMPERIO_SALOMAO": {
      const hasEnoughTerritories = playerTerritories.length >= (objective.conditionData?.territoryCount || 15);
      const hasEnoughGold = player.resources.ouro >= (objective.conditionData?.resourcesRequired || 50);
      
      const totalFaith = playerTerritories.reduce((sum, t) => sum + t.feAtual, 0);
      const hasEnoughFaith = totalFaith >= (objective.conditionData?.faithRequired || 100);

      return hasEnoughTerritories && hasEnoughGold && hasEnoughFaith;
    }

    case "TERRA_PROMETIDA": {
      const sacredTerritories = state.territories.filter((t) => t.type === "sagrado");
      const playerSacredTerritories = sacredTerritories.filter((t) => t.donoAtual === playerId);

      if (playerSacredTerritories.length !== sacredTerritories.length) {
        return false;
      }

      const faithLevel = objective.conditionData?.faithLevel || 80;
      return playerSacredTerritories.every((t) => t.feAtual >= faithLevel);
    }

    default:
      return false;
  }
}

/**
 * Verifica condição de vitória por legado + controle territorial.
 */
export function checkLegacyVictory(state: GameState, playerId: PlayerId): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  const legacyRequired = state.mode === "rapido" ? 100 : 150;
  const hasEnoughLegacy = player.resources.legado >= legacyRequired;

  if (!hasEnoughLegacy) return false;

  const playerTerritories = state.territories.filter((t) => t.donoAtual === playerId);
  const playerCount = state.players.length;

  let territoryRequired: number;
  if (playerCount <= 3) {
    territoryRequired = 12;
  } else if (playerCount <= 5) {
    territoryRequired = 9;
  } else {
    territoryRequired = 7;
  }

  return playerTerritories.length >= territoryRequired;
}

/**
 * Verifica todas as condições de vitória para um jogador.
 */
export function checkVictoryConditions(
  state: GameState,
  playerId: PlayerId
): { hasWon: boolean; reason?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { hasWon: false };

  if (player.objetivoSecretoId) {
    const objective = state.territories[0];
    
    const objectiveCompleted = checkObjectiveCompleted(state, playerId, {
      id: player.objetivoSecretoId,
      name: "",
      description: "",
      tier: "medio",
      conditionKey: player.objetivoSecretoId.replace("obj_", "").toUpperCase(),
    });

    if (objectiveCompleted) {
      return { hasWon: true, reason: "Objetivo secreto completado!" };
    }
  }

  if (checkLegacyVictory(state, playerId)) {
    return { hasWon: true, reason: "Vitória por legado e controle territorial!" };
  }

  return { hasWon: false };
}
