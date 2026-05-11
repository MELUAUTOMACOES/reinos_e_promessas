
import type { SecretObjective } from "@/types";

export const SECRET_OBJECTIVES: SecretObjective[] = [
  {
    id: "obj_dominio_cana",
    description: "Controle todos os territórios de Canaã (Judá, Benjamim e Israel Norte).",
    conditionKey: "CONTROL_REGIONS:canaa,israel_norte",
    victoryPoints: 5,
  },
  {
    id: "obj_costa",
    description: "Controle toda a Costa & Fenícia (Filístia, Gaza, Tiro e Sidom).",
    conditionKey: "CONTROL_REGIONS:costa,fenicia",
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
    description: "Controle toda a Transjordânia (Moabe, Edom, Amom e Gileade).",
    conditionKey: "CONTROL_REGIONS:transjordania",
    victoryPoints: 3,
  },
  {
    id: "obj_jerusalem",
    description: "Controle Jerusalém por 5 turnos consecutivos.",
    conditionKey: "HOLD_TERRITORY_5_TURNS:jerusalem",
    victoryPoints: 6,
  },
  {
    id: "obj_fe",
    description: "Tenha um território com fé máxima (100) e outro com fé mínima (0) ao mesmo tempo.",
    conditionKey: "FAITH_EXTREMES",
    victoryPoints: 4,
  },
  {
    id: "obj_tropas",
    description: "Tenha 25 ou mais tropas em campo ao mesmo tempo.",
    conditionKey: "TROPAS_GTE_25",
    victoryPoints: 3,
  },
  {
    id: "obj_mesopotamia",
    description: "Conquiste Nínive ou Babilônia.",
    conditionKey: "CONTROL_ANY:ninive,babilonia",
    victoryPoints: 5,
  },
  {
    id: "obj_ouro",
    description: "Acumule 40 moedas de ouro de uma vez.",
    conditionKey: "OURO_GTE_40",
    victoryPoints: 3,
  },
  {
    id: "obj_expansao",
    description: "Controle ao menos 12 territórios ao mesmo tempo.",
    conditionKey: "TERRITORIES_GTE_12",
    victoryPoints: 4,
  },
];
