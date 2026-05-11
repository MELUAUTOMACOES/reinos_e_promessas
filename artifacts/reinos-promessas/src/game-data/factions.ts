
export interface Faction {
  id: string;
  name: string;
  color: string;
  description: string;
  startingBonus: string;
}

export const FACTIONS: Faction[] = [
  {
    id: "israel",
    name: "Israel",
    color: "#1d4ed8",
    description: "O povo escolhido de Deus. Alta Fé, forte defesa em Jerusalém.",
    startingBonus: "+2 Fé inicial, +1 exército em Jerusalém",
  },
  {
    id: "juda",
    name: "Judá",
    color: "#7c3aed",
    description: "Descendentes de Davi. Bônus em territórios do sul e fé.",
    startingBonus: "+3 Ouro inicial, controla Hebrom ao início",
  },
  {
    id: "filisteus",
    name: "Filisteus",
    color: "#dc2626",
    description: "Guerreiros do mar. Alta capacidade militar, bônus em combate.",
    startingBonus: "+2 exércitos em Gaza, vantagem em dados de ataque",
  },
  {
    id: "edomitas",
    name: "Edomitas",
    color: "#b45309",
    description: "Filhos de Esaú. Habilidosos em mineração e comércio.",
    startingBonus: "+3 Ouro inicial, controla Edom",
  },
  {
    id: "arameanos",
    name: "Arameanos",
    color: "#059669",
    description: "Reino de Damasco. Controle das rotas de comércio do norte.",
    startingBonus: "+4 Ouro inicial, controla Damasco",
  },
  {
    id: "fenícios",
    name: "Fenícios",
    color: "#0891b2",
    description: "Mestres do comércio marítimo. Alta produção de ouro.",
    startingBonus: "Controla Tiro, +5 Ouro inicial",
  },
];
