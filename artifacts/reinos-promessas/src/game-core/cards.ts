
import type { GameState, Card, CardId } from "@/types";

/**
 * Embaralha um array de cartas.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Reabastece o mercado com cartas do baralho.
 * Sempre mantém 3 cartas no mercado.
 */
export function refillMarket(state: GameState): GameState {
  const needed = 3 - state.mercado.length;
  if (needed <= 0 || state.deck.length === 0) return state;

  const cardsToAdd = state.deck.slice(0, Math.min(needed, state.deck.length));
  const remainingDeck = state.deck.slice(cardsToAdd.length);

  return {
    ...state,
    mercado: [...state.mercado, ...cardsToAdd],
    deck: remainingDeck,
  };
}

/**
 * Compra uma carta aleatória do baralho.
 */
export function buyRandomCard(state: GameState): { card: Card | null; newDeck: Card[] } {
  if (state.deck.length === 0) {
    return { card: null, newDeck: [] };
  }

  const card = state.deck[0];
  const newDeck = state.deck.slice(1);

  return { card, newDeck };
}

/**
 * Compra uma carta específica do mercado.
 */
export function buyMarketCard(state: GameState, cardId: CardId): { 
  card: Card | null; 
  newMercado: Card[];
} {
  const cardIndex = state.mercado.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return { card: null, newMercado: state.mercado };
  }

  const card = state.mercado[cardIndex];
  const newMercado = state.mercado.filter((_, i) => i !== cardIndex);

  return { card, newMercado };
}

/**
 * Verifica se um personagem já está ativo em qualquer jogador.
 */
export function isCharacterActive(state: GameState, cardId: CardId): boolean {
  return state.players.some(
    (p) => p.personagemAtivo !== null && p.personagemAtivo.cardId === cardId
  );
}

/**
 * Verifica se o jogador pode comprar uma carta (limite de 5 na mão).
 */
export function canBuyCard(playerHand: Card[]): boolean {
  return playerHand.length < 5;
}
