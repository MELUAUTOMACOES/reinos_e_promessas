
import type { SecretObjective } from "@/types";

export const SECRET_OBJECTIVES: SecretObjective[] = [
  // ── Tier Médio ────────────────────────────────────────────────────────────
  {
    id: "obj_reino_davi",
    name: "Reino de Davi",
    description: "Controle Hebrom, Belém e Jerusalém. Jerusalém precisa ter fé 60+.",
    tier: "medio",
    conditionKey: "REINO_DAVI",
    conditionData: {
      territories: ["hebrom", "belem", "jerusalem"],
      faithRequired: 60,
    },
  },
  {
    id: "obj_caminho_exodo",
    name: "Caminho do Êxodo",
    description: "Controle Gósen, Sinai e Jericó. Tenha 8 provisões no fim do turno.",
    tier: "medio",
    conditionKey: "CAMINHO_EXODO",
    conditionData: {
      territories: ["gosen", "sinai", "jerico"],
      resourcesRequired: 8,
    },
  },
  {
    id: "obj_dominio_rotas",
    name: "Domínio das Rotas",
    description: "Controle Gaza, Megido, Damasco e Tiro por 1 rodada completa.",
    tier: "medio",
    conditionKey: "DOMINIO_ROTAS",
    conditionData: {
      territories: ["gaza", "megido", "damasco", "tiro"],
      roundsRequired: 1,
    },
  },
  {
    id: "obj_reino_fiel",
    name: "Reino Fiel",
    description: "Tenha 5 territórios com fé acima de 70 e controle 1 cidade sagrada.",
    tier: "medio",
    conditionKey: "REINO_FIEL",
    conditionData: {
      territoryCount: 5,
      faithLevel: 70,
    },
  },

  // ── Tier Difícil (para futuro) ───────────────────────────────────────────
  {
    id: "obj_imperio_salomao",
    name: "Império de Salomão",
    description: "Controle 15 territórios e tenha 50 ouro e 100 fé total.",
    tier: "dificil",
    conditionKey: "IMPERIO_SALOMAO",
    conditionData: {
      territoryCount: 15,
      resourcesRequired: 50,
      faithRequired: 100,
    },
  },
  {
    id: "obj_terra_prometida",
    name: "Terra Prometida",
    description: "Controle todos os territórios sagrados com fé 80+ em cada um.",
    tier: "dificil",
    conditionKey: "TERRA_PROMETIDA",
    conditionData: {
      faithLevel: 80,
    },
  },
];

/**
 * Retorna objetivos de um tier específico.
 */
export function getObjectivesByTier(tier: "medio" | "dificil"): SecretObjective[] {
  return SECRET_OBJECTIVES.filter((obj) => obj.tier === tier);
}

/**
 * Sorteia um objetivo aleatório de um tier.
 */
export function getRandomObjective(tier: "medio" | "dificil"): SecretObjective {
  const objectives = getObjectivesByTier(tier);
  const randomIndex = Math.floor(Math.random() * objectives.length);
  return objectives[randomIndex];
}
