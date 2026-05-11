
import type { FaithLevel, Territory, TerritoryControlState } from "@/types";

// ─── Faith Level ─────────────────────────────────────────────────────────────

/**
 * Maps a numeric faith value (0–100) to its named level.
 *
 * 0–19  → rebelde
 * 20–39 → fraco
 * 40–59 → estavel
 * 60–79 → forte
 * 80–100 → fiel
 */
export function getTerritoryFaithStatus(faith: number): FaithLevel {
  if (faith <= 19) return "rebelde";
  if (faith <= 39) return "fraco";
  if (faith <= 59) return "estavel";
  if (faith <= 79) return "forte";
  return "fiel";
}

/** Alias kept for backward compatibility */
export const getFaithLevel = getTerritoryFaithStatus;

// ─── Faith Level Info ─────────────────────────────────────────────────────────

export interface FaithLevelInfo {
  level: FaithLevel;
  label: string;
  color: string;
  description: string;
  defenseBonus: number;
  productionModifier: number;
}

export const FAITH_LEVEL_INFO: Record<FaithLevel, FaithLevelInfo> = {
  rebelde: {
    level: "rebelde",
    label: "Rebelde",
    color: "#dc2626",
    description: "O povo rejeita qualquer liderança. Risco de revolta.",
    defenseBonus: -1,
    productionModifier: -0.25,
  },
  fraco: {
    level: "fraco",
    label: "Fraco",
    color: "#f97316",
    description: "Fé instável. Território vulnerável à influência inimiga.",
    defenseBonus: 0,
    productionModifier: -0.1,
  },
  estavel: {
    level: "estavel",
    label: "Estável",
    color: "#eab308",
    description: "O povo aceita o governo. Produção e defesa normais.",
    defenseBonus: 0,
    productionModifier: 0,
  },
  forte: {
    level: "forte",
    label: "Forte",
    color: "#22c55e",
    description: "Fé consolidada. Bônus de defesa e produção.",
    defenseBonus: 1,
    productionModifier: 0.1,
  },
  fiel: {
    level: "fiel",
    label: "Fiel / Protegido",
    color: "#3b82f6",
    description: "Território abençoado. Alta defesa e produção máxima.",
    defenseBonus: 2,
    productionModifier: 0.2,
  },
};

// ─── Faith Helpers ────────────────────────────────────────────────────────────

/** Returns the FaithLevelInfo for a given numeric faith value */
export function getFaithInfo(faith: number): FaithLevelInfo {
  return FAITH_LEVEL_INFO[getTerritoryFaithStatus(faith)];
}

/**
 * Derives the TerritoryControlState from ownership and faith.
 *
 * | donoAtual | faith   | estado      |
 * |-----------|---------|-------------|
 * | null      | any     | neutro      |
 * | player    | 0–19    | rebelde     |
 * | player    | 20–39   | instavel    |
 * | player    | 40–59   | pressionado |
 * | player    | 60+     | controlado  |
 */
export function deriveTerritoryControlState(
  donoAtual: string | null,
  feAtual: number
): TerritoryControlState {
  if (donoAtual === null) return "neutro";
  const level = getTerritoryFaithStatus(feAtual);
  switch (level) {
    case "rebelde": return "rebelde";
    case "fraco":   return "instavel";
    case "estavel": return "pressionado";
    case "forte":
    case "fiel":    return "controlado";
  }
}

/**
 * Returns a new territory snapshot with `estado` updated from current ownership and faith.
 * Call this after any change to `feAtual` or `donoAtual`.
 */
export function updateTerritoryState(territory: Territory): Territory {
  return {
    ...territory,
    estado: deriveTerritoryControlState(territory.donoAtual, territory.feAtual),
  };
}

/**
 * Calculates the effective defense of a territory factoring in faith level.
 */
export function calculateEffectiveDefense(territory: Territory): number {
  const faithInfo = getFaithInfo(territory.feAtual);
  return Math.max(1, territory.defesaNatural + faithInfo.defenseBonus);
}

/**
 * Applies a faith change to a territory (clamped 0–100) and updates estado.
 */
export function applyFaithChange(territory: Territory, delta: number): Territory {
  const updated = {
    ...territory,
    feAtual: Math.min(100, Math.max(0, territory.feAtual + delta)),
  };
  return updateTerritoryState(updated);
}

/**
 * Applies conquest: new owner takes over, faith drops by 15 (min 0), estado updated.
 */
export function faithOnConquest(territory: Territory, newOwnerId: string | null): Territory {
  const faithDrop = newOwnerId === null ? 0 : -15;
  const updated = {
    ...territory,
    feAtual: Math.min(100, Math.max(0, territory.feAtual + faithDrop)),
    donoAtual: newOwnerId,
  };
  return updateTerritoryState(updated);
}

/**
 * Decays or recovers faith toward feBase each turn at a rate of ±5.
 * Updates estado automatically.
 */
export function decayFaithTowardBase(territory: Territory): Territory {
  const diff = territory.feBase - territory.feAtual;
  if (diff === 0) return territory;
  const step = diff > 0 ? Math.min(5, diff) : Math.max(-5, diff);
  const updated = { ...territory, feAtual: territory.feAtual + step };
  return updateTerritoryState(updated);
}
