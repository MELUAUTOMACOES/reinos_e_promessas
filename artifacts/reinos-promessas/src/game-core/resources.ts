
import type { Player, Territory, ResourceState, Region } from "@/types";
import { RESOURCE_LIMITS, TROOP_LIMITS } from "@/types";
import { getFaithInfo } from "./faith";

// ─── Troop limit helper ───────────────────────────────────────────────────────

/**
 * Returns the maximum troops allowed in a territory based on its type.
 *
 * comum: 6 | estrategico: 8 | sagrado: 10 | capital: 12
 */
export function getTroopLimit(territory: Territory): number {
  return TROOP_LIMITS[territory.type];
}

// ─── Resource limits ──────────────────────────────────────────────────────────

/**
 * Caps a ResourceState at the defined global limits. Excess is discarded.
 * legado has no upper cap.
 */
export function applyResourceLimits(resources: ResourceState): ResourceState {
  return {
    provisao: Math.min(resources.provisao, RESOURCE_LIMITS.provisao),
    ouro: Math.min(resources.ouro, RESOURCE_LIMITS.ouro),
    influencia: Math.min(resources.influencia, RESOURCE_LIMITS.influencia),
    legado: resources.legado, // no cap
  };
}

// ─── Production calculation ───────────────────────────────────────────────────

/**
 * Calculates the resource production of a single territory for its owner.
 * Applies the faith modifier to all resource outputs.
 * Pure function — no side effects.
 */
export function calculateTerritoryProduction(territory: Territory): ResourceState {
  const faithInfo = getFaithInfo(territory.feAtual);
  const mod = 1 + faithInfo.productionModifier;

  return {
    provisao: Math.round(territory.producao.provisao * mod),
    ouro: Math.round(territory.producao.ouro * mod),
    influencia: Math.round(territory.producao.influencia * mod),
    legado: 0,
  };
}

/**
 * Calculates the total resource production for a player from all controlled territories
 * plus any region control bonuses.
 *
 * Pure function — no side effects.
 */
export function calculatePlayerProduction(
  playerId: string,
  territories: Territory[],
  regions: Region[]
): ResourceState {
  const controlled = territories.filter((t) => t.donoAtual === playerId);

  const base: ResourceState = { provisao: 0, ouro: 0, influencia: 0, legado: 0 };

  // Sum territory production
  const fromTerritories = controlled.reduce((acc, t) => {
    const prod = calculateTerritoryProduction(t);
    return {
      provisao: acc.provisao + prod.provisao,
      ouro: acc.ouro + prod.ouro,
      influencia: acc.influencia + prod.influencia,
      legado: acc.legado,
    };
  }, base);

  // Add region control bonuses
  const controlledIds = new Set(controlled.map((t) => t.id));
  const regionBonus = regions.reduce(
    (acc, region) => {
      const ownsAll = region.territoryIds.every((id) => controlledIds.has(id));
      if (!ownsAll) return acc;
      return {
        provisao: acc.provisao + (region.bonusControle.provisao ?? 0),
        ouro: acc.ouro + (region.bonusControle.ouro ?? 0),
        influencia: acc.influencia + (region.bonusControle.influencia ?? 0),
        legado: acc.legado + (region.bonusControle.legado ?? 0),
      };
    },
    { provisao: 0, ouro: 0, influencia: 0, legado: 0 }
  );

  return {
    provisao: fromTerritories.provisao + regionBonus.provisao,
    ouro: fromTerritories.ouro + regionBonus.ouro,
    influencia: fromTerritories.influencia + regionBonus.influencia,
    legado: fromTerritories.legado + regionBonus.legado,
  };
}

// ─── applyProduction ──────────────────────────────────────────────────────────

export interface ProductionResult {
  updatedPlayer: Player;
  updatedTerritories: Territory[];
  log: string[];
}

/**
 * Applies production for a specific player:
 * 1. Calculates total resource yield (territories + region bonuses).
 * 2. Applies resource limits (excess discarded).
 * 3. Applies military production — adds troops to territory up to troop limit.
 *
 * Returns updated player, territories, and a log of events.
 * Pure function — no side effects.
 */
export function applyProduction(
  player: Player,
  territories: Territory[],
  regions: Region[]
): ProductionResult {
  const log: string[] = [];

  // ── Resource production ───────────────────────────────────────────────────
  const produced = calculatePlayerProduction(player.id, territories, regions);

  const beforeResources = player.resources;
  const afterUncapped: ResourceState = {
    provisao: beforeResources.provisao + produced.provisao,
    ouro: beforeResources.ouro + produced.ouro,
    influencia: beforeResources.influencia + produced.influencia,
    legado: beforeResources.legado + produced.legado,
  };
  const afterCapped = applyResourceLimits(afterUncapped);

  // Log excess losses
  if (afterUncapped.provisao > afterCapped.provisao) {
    log.push(`${player.name}: excedente de ${afterUncapped.provisao - afterCapped.provisao} provisão descartado (limite ${RESOURCE_LIMITS.provisao}).`);
  }
  if (afterUncapped.ouro > afterCapped.ouro) {
    log.push(`${player.name}: excedente de ${afterUncapped.ouro - afterCapped.ouro} ouro descartado (limite ${RESOURCE_LIMITS.ouro}).`);
  }
  if (afterUncapped.influencia > afterCapped.influencia) {
    log.push(`${player.name}: excedente de ${afterUncapped.influencia - afterCapped.influencia} influência descartado (limite ${RESOURCE_LIMITS.influencia}).`);
  }

  const updatedPlayer: Player = { ...player, resources: afterCapped };

  // ── Military production (troops) ──────────────────────────────────────────
  const updatedTerritories = territories.map((t) => {
    if (t.donoAtual !== player.id) return t;
    const militarProd = t.producao.militar ?? 0;
    if (militarProd <= 0) return t;

    const limit = getTroopLimit(t);
    const canAdd = Math.min(militarProd, limit - t.tropasAtuais);
    if (canAdd <= 0) return t;

    log.push(`${t.name}: +${canAdd} tropa(s) por produção militar.`);
    return { ...t, tropasAtuais: t.tropasAtuais + canAdd };
  });

  return { updatedPlayer, updatedTerritories, log };
}

// ─── Legacy helpers ───────────────────────────────────────────────────────────

/** @deprecated Use calculatePlayerProduction instead */
export function calculateProduction(
  player: Player,
  territories: Territory[]
): ResourceState {
  return calculatePlayerProduction(player.id, territories, []);
}

/** @deprecated Use applyResourceLimits + merge instead */
export function applyProductionToPlayer(
  player: Player,
  produced: ResourceState
): Player {
  const uncapped: ResourceState = {
    provisao: player.resources.provisao + produced.provisao,
    ouro: player.resources.ouro + produced.ouro,
    influencia: player.resources.influencia + produced.influencia,
    legado: player.resources.legado + produced.legado,
  };
  return { ...player, resources: applyResourceLimits(uncapped) };
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
