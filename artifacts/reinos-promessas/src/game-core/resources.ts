
import type { Player, Territory, ResourceState } from "@/types";
import { getFaithInfo } from "./faith";

/**
 * Calculates resources produced for a player at the start of their production phase.
 * Pure function — no side effects.
 */
export function calculateProduction(
  player: Player,
  territories: Territory[]
): ResourceState {
  const controlled = territories.filter((t) => t.donoAtual === player.id);

  const production: ResourceState = {
    provisao: 1,
    ouro: 1,
    influencia: 0,
    legado: 0,
  };

  for (const territory of controlled) {
    const faithInfo = getFaithInfo(territory.feAtual);
    const mod = 1 + faithInfo.productionModifier;

    production.provisao += Math.round(territory.producao.provisao * mod);
    production.ouro += Math.round(territory.producao.ouro * mod);
    production.influencia += Math.round(territory.producao.influencia * mod);
  }

  return production;
}

/**
 * Applies produced resources to a player snapshot.
 */
export function applyProduction(player: Player, produced: ResourceState): Player {
  return {
    ...player,
    resources: {
      provisao: player.resources.provisao + produced.provisao,
      ouro: player.resources.ouro + produced.ouro,
      influencia: player.resources.influencia + produced.influencia,
      legado: player.resources.legado + produced.legado,
    },
  };
}

/**
 * Calculates the troop reinforcement count a player receives each turn.
 * Based on territories controlled (minimum 3).
 */
export function calculateReinforcements(
  player: Player,
  territories: Territory[]
): number {
  const controlled = territories.filter((t) => t.donoAtual === player.id).length;
  return Math.max(3, Math.floor(controlled / 3));
}
