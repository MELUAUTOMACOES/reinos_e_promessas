
import type { Card } from "@/types";

export const CARDS: Card[] = [
  // ── Bênçãos ──────────────────────────────────────────────────────────────
  {
    id: "bencao_davi",
    name: "Unção de Davi",
    type: "bencao",
    description: "Receba +3 tropas gratuitamente neste turno.",
    effectKey: "BONUS_TROPAS_3",
  },
  {
    id: "bencao_salomao",
    name: "Sabedoria de Salomão",
    type: "bencao",
    description: "Dobre a produção de ouro neste turno.",
    effectKey: "DOUBLE_OURO",
  },
  {
    id: "bencao_josue",
    name: "Força de Josué",
    type: "bencao",
    description: "Seus dados de ataque têm vantagem nesta rodada de combate.",
    effectKey: "ATTACK_ADVANTAGE",
  },
  {
    id: "bencao_elia",
    name: "Fogo de Elias",
    type: "bencao",
    description: "Destrua 2 tropas inimigas em um território adjacente.",
    effectKey: "DESTROY_ENEMY_2",
  },
  {
    id: "bencao_ester",
    name: "Favor de Ester",
    type: "bencao",
    description: "Ganhe +5 de influência imediatamente.",
    effectKey: "BONUS_INFLUENCIA_5",
  },
  // ── Maldições ─────────────────────────────────────────────────────────────
  {
    id: "maldicao_praga",
    name: "Praga do Egito",
    type: "maldicao",
    description: "Um jogador escolhido perde -3 de provisão neste turno.",
    effectKey: "ENEMY_PROVISAO_MINUS_3",
  },
  {
    id: "maldicao_seca",
    name: "Grande Seca",
    type: "maldicao",
    description: "Nenhum jogador recebe bônus de região neste turno.",
    effectKey: "NO_REGION_BONUS",
  },
  {
    id: "maldicao_divisao",
    name: "Divisão do Reino",
    type: "maldicao",
    description: "Um jogador escolhido perde 1 território ao acaso para neutro.",
    effectKey: "RANDOM_TERRITORY_NEUTRAL",
  },
  // ── Exércitos ─────────────────────────────────────────────────────────────
  {
    id: "exercito_mercenarios",
    name: "Mercenários Fenícios",
    type: "exercito",
    description: "Coloque 4 tropas em qualquer território que você controla.",
    effectKey: "PLACE_TROPAS_4",
  },
  {
    id: "exercito_carros",
    name: "Carros de Faraó",
    type: "exercito",
    description: "Coloque 5 tropas em um território adjacente ao Egito.",
    effectKey: "PLACE_NEAR_EGYPT_5",
  },
  // ── Profecias ─────────────────────────────────────────────────────────────
  {
    id: "profecia_isaias",
    name: "Profecia de Isaías",
    type: "profecia",
    description: "Veja o objetivo secreto de um adversário.",
    effectKey: "REVEAL_SECRET_OBJECTIVE",
  },
  {
    id: "profecia_daniel",
    name: "Visão de Daniel",
    type: "profecia",
    description: "Veja as 3 próximas cartas do baralho.",
    effectKey: "PEEK_DECK_3",
  },
  // ── Eventos ───────────────────────────────────────────────────────────────
  {
    id: "evento_alianca",
    name: "Aliança Santa",
    type: "evento",
    description: "Duas facções aliadas compartilham defesa por 1 turno.",
    effectKey: "SHARED_DEFENSE",
  },
  {
    id: "evento_exodo",
    name: "Êxodo",
    type: "evento",
    description: "Mova até 5 tropas para qualquer um dos seus territórios.",
    effectKey: "TELEPORT_TROPAS_5",
  },
];
