
import type { Region } from "@/types";

/**
 * 6 regions of the ancient Near East.
 * A player who controls ALL territories in a region earns the bonusControle each turn.
 */
export const REGIONS: Region[] = [
  {
    id: "egypt",
    name: "Egito",
    territoryIds: ["egito", "gosen", "sinai", "deserto_sur"],
    bonusControle: { provisao: 4, ouro: 3, influencia: 1 },
    description:
      "O delta do Nilo e o grande deserto. Controlar o Egito garante o maior bônus de provisão do jogo, mas exige enfrentar suas poderosas tropas neutras.",
  },
  {
    id: "canaa",
    name: "Canaã / Judá",
    territoryIds: ["hebrom", "jerusalem", "belem", "neguebe", "jerico"],
    bonusControle: { provisao: 2, ouro: 2, influencia: 4, legado: 3 },
    description:
      "A Terra Prometida. Controlar Canaã traz o maior bônus de legado do jogo — mas Jerusalém e Jericó estão fortemente bloqueadas.",
  },
  {
    id: "israel_norte",
    name: "Israel Norte",
    territoryIds: ["siquem", "samaria", "megido"],
    bonusControle: { provisao: 2, ouro: 3, influencia: 2 },
    description:
      "O reino do norte de Israel. Rica em rotas comerciais e poder político, mas de fé fraca.",
  },
  {
    id: "costa",
    name: "Costa & Filistia",
    territoryIds: ["filistia", "gaza", "tiro", "sidom"],
    bonusControle: { ouro: 5, influencia: 3 },
    description:
      "A faixa costeira do Mediterrâneo. Domínio dos Fenícios e Filisteus. Alta produção de ouro e comércio marítimo.",
  },
  {
    id: "fenicia",
    name: "Fenícia",
    territoryIds: ["tiro", "sidom"],
    bonusControle: { ouro: 4, influencia: 2 },
    description:
      "Os mestres do comércio marítimo. Tiro e Sidom juntos formam o maior centro comercial do Mediterrâneo.",
  },
  {
    id: "transjordania",
    name: "Transjordânia",
    territoryIds: ["moabe", "edom", "amom", "gileade"],
    bonusControle: { provisao: 4, influencia: 2 },
    description:
      "As terras a leste do Jordão. Moabe, Edom, Amom e Gileade. Pastagens ricas e rivalidades eternas.",
  },
  {
    id: "aram",
    name: "Aram (Síria)",
    territoryIds: ["damasco"],
    bonusControle: { ouro: 3, influencia: 3 },
    description:
      "O reino de Damasco. Rival constante de Israel. Quem controla Damasco domina as rotas do norte.",
  },
  {
    id: "mesopotamia",
    name: "Mesopotâmia",
    territoryIds: ["ninive", "babilonia", "susa"],
    bonusControle: { ouro: 6, influencia: 5, legado: 2 },
    description:
      "Os grandes impérios do leste. Assíria, Babilônia e Pérsia. Controlar a Mesopotâmia garante poder esmagador — se você conseguir.",
  },
];
