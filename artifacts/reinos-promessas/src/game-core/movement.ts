
import type { Territory, TerritoryId, PlayerId } from "@/types";

/**
 * Validates whether a player can move troops from one territory to another.
 * Pure function — no side effects.
 */
export function canMove(
  from: Territory,
  to: Territory,
  playerId: PlayerId,
  tropasCount: number
): { valid: boolean; reason?: string } {
  if (from.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla o território de origem." };
  }
  if (!from.connections.includes(to.id)) {
    return { valid: false, reason: "Territórios não são adjacentes." };
  }
  if (tropasCount < 1) {
    return { valid: false, reason: "Deve mover ao menos 1 tropa." };
  }
  if (tropasCount >= from.tropasAtuais) {
    return { valid: false, reason: "Deve deixar ao menos 1 tropa no território." };
  }
  return { valid: true };
}

/**
 * Validates whether a player can attack from one territory to another.
 */
export function canAttack(
  from: Territory,
  to: Territory,
  playerId: PlayerId
): { valid: boolean; reason?: string } {
  if (from.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla o território de origem." };
  }
  if (to.donoAtual === playerId) {
    return { valid: false, reason: "Não pode atacar um território seu." };
  }
  if (!from.connections.includes(to.id)) {
    return { valid: false, reason: "Territórios não são adjacentes." };
  }
  if (from.tropasAtuais < 2) {
    return { valid: false, reason: "Precisa de ao menos 2 tropas para atacar." };
  }
  if (to.bloqueado) {
    return { valid: false, reason: "Este território está bloqueado e não pode ser atacado ainda." };
  }
  return { valid: true };
}

/**
 * Finds all territories reachable from a starting territory
 * through connected friendly territories (for reinforcement).
 */
export function findReachable(
  startId: TerritoryId,
  territories: Territory[],
  playerId: PlayerId
): TerritoryId[] {
  const map = new Map(territories.map((t) => [t.id, t]));
  const visited = new Set<TerritoryId>();
  const queue = [startId];

  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const territory = map.get(current);
    if (!territory || territory.donoAtual !== playerId) continue;

    for (const adjId of territory.connections) {
      if (!visited.has(adjId)) queue.push(adjId);
    }
  }

  return [...visited].filter((id) => id !== startId);
}
