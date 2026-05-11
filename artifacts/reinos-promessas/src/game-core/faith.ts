
import type { FaithLevel, Territory } from "@/types";

// ─── Faith Level ─────────────────────────────────────────────────────────────

/**
 * Maps a numeric faith value (0–100) to its named level.
 */
export function getFaithLevel(faith: number): FaithLevel {
  if (faith <= 19) return "rebelde";
  if (faith <= 39) return "fraco";
  if (faith <= 59) return "estavel";
  if (faith <= 79) return "forte";
  return "fiel";
}

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
  return FAITH_LEVEL_INFO[getFaithLevel(faith)];
}

/**
 * Calculates the effective defense of a territory factoring in faith level.
 */
export function calculateEffectiveDefense(territory: Territory): number {
  const faithInfo = getFaithInfo(territory.feAtual);
  return Math.max(1, territory.defesaNatural + faithInfo.defenseBonus);
}

/**
 * Applies a faith change to a territory, clamped between 0 and 100.
 * Returns a new territory snapshot.
 */
export function applyFaithChange(territory: Territory, delta: number): Territory {
  return {
    ...territory,
    feAtual: Math.min(100, Math.max(0, territory.feAtual + delta)),
  };
}

/**
 * When a territory changes owner, faith drops toward the base value of the new owner.
 * This simulates the population adjusting to a new ruler.
 */
export function faithOnConquest(territory: Territory, newOwnerId: string | null): Territory {
  const drop = newOwnerId === null ? 0 : -15;
  const newFaith = Math.min(100, Math.max(0, territory.feAtual + drop));
  return {
    ...territory,
    feAtual: newFaith,
    donoAtual: newOwnerId,
    estado: newOwnerId === null ? "neutro" : "controlado",
  };
}

/**
 * Decays or recovers faith each turn toward the territory's feBase value.
 * Rate: ±5 per turn.
 */
export function decayFaithTowardBase(territory: Territory): Territory {
  const diff = territory.feBase - territory.feAtual;
  if (diff === 0) return territory;
  const step = diff > 0 ? Math.min(5, diff) : Math.max(-5, diff);
  return {
    ...territory,
    feAtual: territory.feAtual + step,
  };
}
