
import type { Card } from "@/types";

export const CARDS: Card[] = [
  // ── Bênçãos ──────────────────────────────────────────────────────────────
  {
    id: "bencao_davi",
    name: "Unção de Davi",
    type: "blessing",
    description: "Receba +3 exércitos gratuitamente neste turno.",
    effectKey: "BONUS_ARMIES_3",
  },
  {
    id: "bencao_salomao",
    name: "Sabedoria de Salomão",
    type: "blessing",
    description: "Dobre a produção de ouro neste turno.",
    effectKey: "DOUBLE_GOLD",
  },
  {
    id: "bencao_josue",
    name: "Força de Josué",
    type: "blessing",
    description: "Seus dados de ataque têm vantagem nesta rodada de combate.",
    effectKey: "ATTACK_ADVANTAGE",
  },
  {
    id: "bencao_elia",
    name: "Fogo de Elias",
    type: "blessing",
    description: "Destrua 2 exércitos inimigos em um território adjacente.",
    effectKey: "DESTROY_ENEMY_2",
  },
  {
    id: "bencao_ester",
    name: "Favor de Ester",
    type: "blessing",
    description: "Negocie uma trégua temporária com outro jogador por 2 turnos.",
    effectKey: "TRUCE_2_TURNS",
  },
  // ── Maldições ─────────────────────────────────────────────────────────────
  {
    id: "maldicao_praga",
    name: "Praga do Egito",
    type: "curse",
    description: "Um jogador à sua escolha perde 2 de produção de alimento neste turno.",
    effectKey: "ENEMY_FOOD_MINUS_2",
  },
  {
    id: "maldicao_seca",
    name: "Grande Seca",
    type: "curse",
    description: "Nenhum jogador recebe bônus de região neste turno.",
    effectKey: "NO_REGION_BONUS",
  },
  {
    id: "maldicao_divisao",
    name: "Divisão do Reino",
    type: "curse",
    description: "Um jogador escolhido perde 1 território ao acaso para neutro.",
    effectKey: "RANDOM_TERRITORY_NEUTRAL",
  },
  // ── Exércitos ─────────────────────────────────────────────────────────────
  {
    id: "exercito_mercenarios",
    name: "Mercenários Fenícios",
    type: "army",
    description: "Coloque 4 exércitos em qualquer território que você controla.",
    effectKey: "PLACE_ARMIES_4",
  },
  {
    id: "exercito_carros",
    name: "Carros de Faraó",
    type: "army",
    description: "Coloque 5 exércitos em um território adjacente ao Egito.",
    effectKey: "PLACE_NEAR_EGYPT_5",
  },
  // ── Profecias ─────────────────────────────────────────────────────────────
  {
    id: "profecia_isaias",
    name: "Profecia de Isaías",
    type: "prophecy",
    description: "Veja o objetivo secreto de um adversário.",
    effectKey: "REVEAL_SECRET_OBJECTIVE",
  },
  {
    id: "profecia_daniel",
    name: "Visão de Daniel",
    type: "prophecy",
    description: "Veja as 3 próximas cartas do baralho.",
    effectKey: "PEEK_DECK_3",
  },
  // ── Eventos ───────────────────────────────────────────────────────────────
  {
    id: "evento_alianca",
    name: "Aliança Santa",
    type: "event",
    description: "Duas facções aliadas compartilham defesa por 1 turno.",
    effectKey: "SHARED_DEFENSE",
  },
  {
    id: "evento_exodo",
    name: "Êxodo",
    type: "event",
    description: "Mova até 5 exércitos para qualquer um dos seus territórios.",
    effectKey: "TELEPORT_ARMIES_5",
  },
];
