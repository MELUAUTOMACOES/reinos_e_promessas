
import type { Region } from "@/types";

export const REGIONS: Region[] = [
  {
    id: "judah",
    name: "Reino de Judá",
    territoryIds: ["jerusalem", "hebron", "beersheba", "negev"],
    controlBonus: { gold: 2, faith: 3 },
  },
  {
    id: "benjamin",
    name: "Benjamim",
    territoryIds: ["jerico"],
    controlBonus: { gold: 1 },
  },
  {
    id: "israel_norte",
    name: "Reino de Israel",
    territoryIds: ["samaria", "megido"],
    controlBonus: { gold: 2, food: 2 },
  },
  {
    id: "fenicia",
    name: "Fenícia",
    territoryIds: ["acre", "tiro", "sidao"],
    controlBonus: { gold: 5 },
  },
  {
    id: "filistia",
    name: "Filistia",
    territoryIds: ["filistia_norte", "filistia_sul"],
    controlBonus: { gold: 2, food: 1 },
  },
  {
    id: "egypt",
    name: "Egito",
    territoryIds: ["egito_norte", "egito_sul"],
    controlBonus: { food: 5, gold: 2 },
  },
  {
    id: "transjordan",
    name: "Transjordânia",
    territoryIds: ["transjordania_norte", "transjordania_sul", "edom"],
    controlBonus: { food: 3 },
  },
  {
    id: "aram",
    name: "Aram (Síria)",
    territoryIds: ["damasco", "hamate"],
    controlBonus: { gold: 3 },
  },
  {
    id: "assyria",
    name: "Assíria",
    territoryIds: ["assíria"],
    controlBonus: { gold: 3 },
  },
  {
    id: "babylon",
    name: "Babilônia",
    territoryIds: ["babilonia"],
    controlBonus: { gold: 3, food: 1 },
  },
  {
    id: "desert",
    name: "Deserto",
    territoryIds: ["sinai"],
    controlBonus: { faith: 2 },
  },
];
