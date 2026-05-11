
import type { SecretObjective } from "@/types";

export const SECRET_OBJECTIVES: SecretObjective[] = [
  {
    id: "obj_dominio_cana",
    description: "Controle todos os territórios de Canaã (Judá, Benjamim e Israel Norte).",
    conditionKey: "CONTROL_REGIONS:judah,benjamin,israel_norte",
    victoryPoints: 5,
  },
  {
    id: "obj_costa",
    description: "Controle toda a costa mediterrânea (Fenícia e Filistia).",
    conditionKey: "CONTROL_REGIONS:fenicia,filistia",
    victoryPoints: 4,
  },
  {
    id: "obj_egito",
    description: "Conquiste o Egito e mantenha por 3 turnos consecutivos.",
    conditionKey: "HOLD_REGION_3_TURNS:egypt",
    victoryPoints: 5,
  },
  {
    id: "obj_transjordania",
    description: "Controle toda a Transjordânia.",
    conditionKey: "CONTROL_REGIONS:transjordan",
    victoryPoints: 3,
  },
  {
    id: "obj_fe",
    description: "Alcance 100 pontos de Fé antes de qualquer outro jogador.",
    conditionKey: "FIRST_FAITH_100",
    victoryPoints: 4,
  },
  {
    id: "obj_exercitos",
    description: "Tenha 30 ou mais exércitos em campo ao mesmo tempo.",
    conditionKey: "ARMIES_GTE_30",
    victoryPoints: 3,
  },
  {
    id: "obj_jerusalem",
    description: "Controle Jerusalém por 5 turnos consecutivos.",
    conditionKey: "HOLD_TERRITORY_5_TURNS:jerusalem",
    victoryPoints: 6,
  },
  {
    id: "obj_babilonia",
    description: "Conquiste Babilônia e Nínive.",
    conditionKey: "CONTROL_REGIONS:assyria,babylon",
    victoryPoints: 5,
  },
  {
    id: "obj_ouro",
    description: "Acumule 50 moedas de ouro de uma vez.",
    conditionKey: "GOLD_GTE_50",
    victoryPoints: 3,
  },
  {
    id: "obj_expansao",
    description: "Controle pelo menos 14 territórios ao mesmo tempo.",
    conditionKey: "TERRITORIES_GTE_14",
    victoryPoints: 4,
  },
];
