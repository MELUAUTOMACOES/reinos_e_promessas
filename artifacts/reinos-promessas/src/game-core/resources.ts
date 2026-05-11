
import type { Player, Territory, Resources } from "@/types";

/**
 * Calculates resources produced for a player at the start of their production phase.
 * Pure function — no side effects.
 */
export function calculateProduction(
  player: Player,
  territories: Territory[]
): Resources {
  const controlled = territories.filter((t) => t.ownerId === player.id);

  const production: Resources = { gold: 1, food: 1, faith: 0 };

  for (const territory of controlled) {
    production.gold += territory.resourceBonus.gold ?? 0;
    production.food += territory.resourceBonus.food ?? 0;
    production.faith += territory.resourceBonus.faith ?? 0;
  }

  // Faith modifier: high faith boosts production slightly
  const faithModifier = player.faith >= 75 ? 1 : 0;
  production.gold += faithModifier;

  return production;
}

/**
 * Applies produced resources to a player snapshot.
 */
export function applyProduction(player: Player, produced: Resources): Player {
  return {
    ...player,
    resources: {
      gold: player.resources.gold + produced.gold,
      food: player.resources.food + produced.food,
      faith: player.resources.faith + produced.faith,
    },
  };
}

/**
 * Calculates the army reinforcement count a player receives each turn.
 * Based on territories controlled (minimum 3).
 */
export function calculateReinforcements(
  player: Player,
  territories: Territory[]
): number {
  const controlled = territories.filter((t) => t.ownerId === player.id).length;
  return Math.max(3, Math.floor(controlled / 3));
}
