
import type { Card } from "@/types";

export const CARDS: Card[] = [
  // ── Personagens ───────────────────────────────────────────────────────────
  {
    id: "personagem_davi",
    name: "Davi",
    type: "personagem",
    rarity: "lendario",
    description: "+3 em 1 combate ofensivo por turno durante 2 rodadas.",
    cost: 4,
    unique: true,
    effects: [
      {
        type: "combat_bonus_offensive",
        value: 3,
        duration: 2,
        usesPerTurn: 1,
      },
    ],
  },
  {
    id: "personagem_josue",
    name: "Josué",
    type: "personagem",
    rarity: "lendario",
    description: "+3 contra cidade fortificada em 1 combate por turno durante 2 rodadas.",
    cost: 4,
    unique: true,
    effects: [
      {
        type: "combat_bonus_fortified",
        value: 3,
        duration: 2,
        usesPerTurn: 1,
        condition: "target_fortified",
      },
    ],
  },
  {
    id: "personagem_neemias",
    name: "Neemias",
    type: "personagem",
    rarity: "raro",
    description: "+2 defesa em um território por 2 rodadas.",
    cost: 4,
    unique: true,
    effects: [
      {
        type: "defense_bonus",
        value: 2,
        duration: 2,
      },
    ],
  },
  {
    id: "personagem_jose",
    name: "José",
    type: "personagem",
    rarity: "incomum",
    description: "+3 provisão imediata.",
    cost: 4,
    unique: true,
    effects: [
      {
        type: "resource_bonus",
        value: 3,
      },
    ],
  },
  {
    id: "personagem_salomao",
    name: "Salomão",
    type: "personagem",
    rarity: "raro",
    description: "Próxima melhoria custa 1 ouro a menos.",
    cost: 4,
    unique: true,
    effects: [
      {
        type: "improvement_discount",
        value: 1,
        usesPerTurn: 1,
      },
    ],
  },
  {
    id: "personagem_samuel",
    name: "Samuel",
    type: "personagem",
    rarity: "incomum",
    description: "+10 fé em um território.",
    cost: 4,
    unique: true,
    effects: [
      {
        type: "faith_bonus",
        value: 10,
      },
    ],
  },

  // ── Táticas ───────────────────────────────────────────────────────────────
  {
    id: "tatica_emboscada",
    name: "Emboscada",
    type: "tatica",
    rarity: "comum",
    description: "+2 em um combate defensivo.",
    cost: 4,
    effects: [
      {
        type: "combat_bonus_defensive",
        value: 2,
      },
    ],
  },
  {
    id: "tatica_cerco",
    name: "Cerco",
    type: "tatica",
    rarity: "comum",
    description: "+2 em um ataque contra cidade.",
    cost: 4,
    effects: [
      {
        type: "combat_bonus_offensive",
        value: 2,
        condition: "target_city",
      },
    ],
  },
  {
    id: "tatica_marcha_forcada",
    name: "Marcha Forçada",
    type: "tatica",
    rarity: "incomum",
    description: "Mova tropas sem custo de ação neste turno.",
    cost: 4,
    effects: [
      {
        type: "free_movement",
      },
    ],
  },
  {
    id: "tatica_recrutamento",
    name: "Recrutamento em Massa",
    type: "tatica",
    rarity: "comum",
    description: "+2 tropas em um território.",
    cost: 4,
    effects: [
      {
        type: "troop_bonus",
        value: 2,
      },
    ],
  },

  // ── Missões ───────────────────────────────────────────────────────────────
  {
    id: "missao_rota_exodo",
    name: "Rota do Êxodo",
    type: "missao",
    rarity: "incomum",
    description: "Controle territórios formando caminho do Egito a Canaã.",
    cost: 4,
    legacyPoints: 3,
    missionCondition: "control_exodus_path",
    effects: [],
  },
  {
    id: "missao_reino_estabelecido",
    name: "Reino Estabelecido",
    type: "missao",
    rarity: "raro",
    description: "Controle 5 territórios consecutivos.",
    cost: 4,
    legacyPoints: 4,
    missionCondition: "control_5_consecutive",
    effects: [],
  },
  {
    id: "missao_guardiao_fe",
    name: "Guardião da Fé",
    type: "missao",
    rarity: "incomum",
    description: "Tenha 3 territórios com fé 'Forte' ou superior.",
    cost: 4,
    legacyPoints: 3,
    missionCondition: "have_3_strong_faith",
    effects: [],
  },
  {
    id: "missao_senhor_rotas",
    name: "Senhor das Rotas",
    type: "missao",
    rarity: "raro",
    description: "Controle todos os territórios estratégicos de uma região.",
    cost: 4,
    legacyPoints: 4,
    missionCondition: "control_all_strategic_in_region",
    effects: [],
  },
];
