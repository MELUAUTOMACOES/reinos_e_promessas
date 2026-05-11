
import type { StartingPack } from "@/types";

/**
 * 9 approved starting packs.
 * Each pack gives a player 2 territories at the start of the game
 * with 2 armies in each. Players choose from available packs.
 */
export const STARTING_PACKS: StartingPack[] = [
  {
    id: "pack_a",
    label: "Pacote A — Êxodo",
    territoryIds: ["gosen", "deserto_sur"],
    description:
      "Gósen e Deserto de Sur. Começa no Egito com alta provisão. Bom para expansão pela costa sul e Neguebe.",
  },
  {
    id: "pack_b",
    label: "Pacote B — Patriarcas",
    territoryIds: ["hebrom", "neguebe"],
    description:
      "Hebrom e Neguebe. O coração de Judá. Alta fé inicial, posição central com acesso ao sul e à costa.",
  },
  {
    id: "pack_c",
    label: "Pacote C — Filisteus",
    territoryIds: ["gaza", "neguebe"],
    description:
      "Gaza e Neguebe. Início costeiro com alto ouro. Rota natural para expandir ao norte e ao leste.",
  },
  {
    id: "pack_d",
    label: "Pacote D — Montanhas de Efraim",
    territoryIds: ["siquem", "gileade"],
    description:
      "Siquém e Gileade. Posição central com acesso ao Jordão. Ideal para expandir em várias direções.",
  },
  {
    id: "pack_e",
    label: "Pacote E — Além do Jordão",
    territoryIds: ["moabe", "edom"],
    description:
      "Moabe e Edom. Início transjordaniano com ouro e provisão equilibrados. Forte em recursos minerais.",
  },
  {
    id: "pack_f",
    label: "Pacote F — Norte Distante",
    territoryIds: ["amom", "damasco"],
    description:
      "Amom e Damasco. Começo no norte com alta influência e ouro. Rota para a Mesopotâmia ou para Canaã.",
  },
  {
    id: "pack_g",
    label: "Pacote G — Pastagens de Davi",
    territoryIds: ["belem", "filistia"],
    description:
      "Belém e Filístia. Fé elevada e posição estratégica. Acesso fácil a Jerusalém pela fronteira.",
  },
  {
    id: "pack_h",
    label: "Pacote H — Fenícia",
    territoryIds: ["sidom", "damasco"],
    description:
      "Sidom e Damasco. Máximo de ouro e influência no início. Ideal para estratégia econômica e diplomática.",
  },
  {
    id: "pack_i",
    label: "Pacote I — Além do Jordão Sul",
    territoryIds: ["moabe", "gileade"],
    description:
      "Moabe e Gileade. Provisão alta e posição defensiva leste. Bom para pressionar o centro de Canaã.",
  },
];
