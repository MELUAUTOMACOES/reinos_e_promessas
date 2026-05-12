
/**
 * game-core/actions.ts
 *
 * Pure action functions for player turns.
 * Every function validates preconditions and returns a result object.
 * No React imports, no side effects.
 */

import type { GameState, TerritoryId, PlayerId, CardId, CombatResult, Territory, InfluenceResult, Card, ActiveCharacter } from "@/types";
import { TROOP_LIMITS } from "@/types";
import { recordAction } from "./turn";
import { applyFaithChange, updateTerritoryState } from "./faith";
import { resolveCombat } from "./combat";
import { resolveInfluence } from "./influence";
import { buyRandomCard, buyMarketCard, refillMarket, isCharacterActive, canBuyCard } from "./cards";

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ActionResult {
  valid: boolean;
  reason?: string;
  state: GameState;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTurn(state: GameState, playerId: PlayerId): string | null {
  if (state.turno.jogadorAtualId !== playerId) return "Não é seu turno.";
  if (state.turno.acoesRestantes <= 0) return "Sem ações restantes.";
  return null;
}

/** Faith ≤ 39 is considered "difficult" — reduced gain for safe option, increased for quiz */
function isFaithDifficult(faith: number): boolean {
  return faith <= 39;
}

function getLegacyForConquest(territory: Territory): number {
  switch (territory.type) {
    case "comum":
      return 3;
    case "estrategico":
      return 6;
    case "sagrado":
      return 10;
    case "capital":
      return 15;
  }
}

// ─── Recruit Troops ───────────────────────────────────────────────────────────

/**
 * Recrutar tropas:
 * - Costs 1 provisão
 * - Adds 2 troops to the territory (or fewer if at limit)
 * - Costs 1 action
 */
export function recruitTroops(
  state: GameState,
  playerId: PlayerId,
  territoryId: TerritoryId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const territory = state.territories.find((t) => t.id === territoryId);
  const player = state.players.find((p) => p.id === playerId);
  if (!territory || !player) {
    return { valid: false, reason: "Território ou jogador não encontrado.", state };
  }
  if (territory.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla este território.", state };
  }
  if (player.resources.provisao < 1) {
    return { valid: false, reason: "Sem provisão suficiente. Custa 1 provisão.", state };
  }

  const limit = TROOP_LIMITS[territory.type];
  if (territory.tropasAtuais >= limit) {
    return {
      valid: false,
      reason: `Limite de tropas atingido em ${territory.name} (máx ${limit}).`,
      state,
    };
  }

  const toAdd = Math.min(2, limit - territory.tropasAtuais);
  const description = `${player.name} recrutou ${toAdd} tropa(s) em ${territory.name}.`;

  const updatedState = recordAction(
    {
      ...state,
      territories: state.territories.map((t) =>
        t.id === territoryId ? { ...t, tropasAtuais: t.tropasAtuais + toAdd } : t
      ),
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, provisao: p.resources.provisao - 1 } }
          : p
      ),
      log: [...state.log, description],
    },
    "RECRUTAR",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Move Troops ──────────────────────────────────────────────────────────────

/**
 * Mover tropas:
 * - Both territories must belong to the player
 * - Territories must be adjacent
 * - Origin must keep at least 1 troop
 * - Destination must not exceed its troop limit
 * - Costs 1 action
 */
export function moveTroops(
  state: GameState,
  playerId: PlayerId,
  fromId: TerritoryId,
  toId: TerritoryId,
  count: number
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const fromT = state.territories.find((t) => t.id === fromId);
  const toT = state.territories.find((t) => t.id === toId);
  const player = state.players.find((p) => p.id === playerId);

  if (!fromT || !toT || !player) {
    return { valid: false, reason: "Território não encontrado.", state };
  }
  if (fromT.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla a origem.", state };
  }
  if (toT.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla o destino.", state };
  }
  if (!fromT.connections.includes(toId)) {
    return { valid: false, reason: "Territórios não são adjacentes.", state };
  }
  if (count < 1) {
    return { valid: false, reason: "Mova ao menos 1 tropa.", state };
  }
  if (count >= fromT.tropasAtuais) {
    return {
      valid: false,
      reason: "A origem deve ficar com ao menos 1 tropa.",
      state,
    };
  }
  const destLimit = TROOP_LIMITS[toT.type];
  if (toT.tropasAtuais + count > destLimit) {
    return {
      valid: false,
      reason: `Destino ficaria acima do limite (máx ${destLimit}).`,
      state,
    };
  }

  const description = `${player.name} moveu ${count} tropa(s) de ${fromT.name} para ${toT.name}.`;

  const updatedState = recordAction(
    {
      ...state,
      territories: state.territories.map((t) => {
        if (t.id === fromId) return { ...t, tropasAtuais: t.tropasAtuais - count };
        if (t.id === toId) return { ...t, tropasAtuais: t.tropasAtuais + count };
        return t;
      }),
      turno: {
        ...state.turno,
        territoriosMovidosNesteturno: [
          ...state.turno.territoriosMovidosNesteturno,
          fromId,
        ],
      },
      log: [...state.log, description],
    },
    "MOVER_TROPAS",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Strengthen Faith ─────────────────────────────────────────────────────────

/**
 * Fortalecer fé:
 *
 * Opção segura:
 *   - faith ≤ 39 (difícil): +5
 *   - faith > 39: +10
 *
 * Opção quiz:
 *   - Correct + difficult: +10
 *   - Correct + normal: +15
 *   - Wrong: -5
 *
 * Costs 1 action.
 */
export function strengthenFaith(
  state: GameState,
  playerId: PlayerId,
  territoryId: TerritoryId,
  option: "safe" | "quiz",
  quizCorrect?: boolean
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const territory = state.territories.find((t) => t.id === territoryId);
  const player = state.players.find((p) => p.id === playerId);

  if (!territory || !player) {
    return { valid: false, reason: "Território não encontrado.", state };
  }
  if (territory.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla este território.", state };
  }

  const difficult = isFaithDifficult(territory.feAtual);
  let delta = 0;
  let description = "";

  if (option === "safe") {
    delta = difficult ? 5 : 10;
    const suffix = difficult ? "(território difícil)" : "";
    description = `${player.name} fortaleceu a fé em ${territory.name} +${delta} ${suffix}.`.trim();
  } else {
    if (quizCorrect) {
      delta = difficult ? 10 : 15;
      description = `${player.name} respondeu certo! Fé em ${territory.name} +${delta}.`;
    } else {
      delta = -5;
      description = `${player.name} errou a questão. Fé em ${territory.name} -5.`;
    }
  }

  const updatedTerritory = applyFaithChange(territory, delta);

  const updatedState = recordAction(
    {
      ...state,
      territories: state.territories.map((t) =>
        t.id === territoryId ? updatedTerritory : t
      ),
      log: [...state.log, description],
    },
    "FORTALECER_FE",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Discard Card ─────────────────────────────────────────────────────────────

/**
 * Descartar carta:
 * - Player must have the card in hand
 * - Costs 1 action
 */
export function discardCard(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { valid: false, reason: "Jogador não encontrado.", state };

  const card = player.cartasNaMao.find((c) => c.id === cardId);
  if (!card) {
    return { valid: false, reason: "Carta não encontrada na mão.", state };
  }

  const description = `${player.name} descartou "${card.name}".`;

  const updatedState = recordAction(
    {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, cartasNaMao: p.cartasNaMao.filter((c) => c.id !== cardId) }
          : p
      ),
      descarte: [...state.descarte, card],
      log: [...state.log, description],
    },
    "DESCARTAR_CARTA",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Attack Territory ─────────────────────────────────────────────────────────

export interface AttackResult extends ActionResult {
  combatResult?: CombatResult;
}

/**
 * Atacar território:
 * - Território de origem deve pertencer ao atacante
 * - Território alvo não pode pertencer ao atacante
 * - Territórios devem ser adjacentes
 * - Origem deve ter mais de 1 tropa
 * - Atacante escolhe quantas tropas usar
 * - Origem deve ficar com pelo menos 1 tropa
 * - Resolve combate e aplica perdas
 * - Se conquistar, território passa para o atacante como instável
 * - Custa 1 ação
 */
export function attackTerritory(
  state: GameState,
  playerId: PlayerId,
  fromId: TerritoryId,
  toId: TerritoryId,
  tropasUsadas: number
): AttackResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const fromT = state.territories.find((t) => t.id === fromId);
  const toT = state.territories.find((t) => t.id === toId);
  const player = state.players.find((p) => p.id === playerId);

  if (!fromT || !toT || !player) {
    return { valid: false, reason: "Território não encontrado.", state };
  }

  if (fromT.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla o território de origem.", state };
  }
  if (toT.donoAtual === playerId) {
    return { valid: false, reason: "Você já controla o território alvo.", state };
  }
  if (!fromT.connections.includes(toId)) {
    return { valid: false, reason: "Territórios não são adjacentes.", state };
  }
  if (fromT.tropasAtuais <= 1) {
    return { valid: false, reason: "Origem deve ter mais de 1 tropa.", state };
  }
  if (tropasUsadas < 1) {
    return { valid: false, reason: "Use ao menos 1 tropa no ataque.", state };
  }
  if (tropasUsadas >= fromT.tropasAtuais) {
    return {
      valid: false,
      reason: "Origem deve ficar com pelo menos 1 tropa.",
      state,
    };
  }
  if (tropasUsadas > fromT.tropasAtuais - 1) {
    return {
      valid: false,
      reason: `Máximo de ${fromT.tropasAtuais - 1} tropas disponíveis para ataque.`,
      state,
    };
  }

  const combatResult = resolveCombat(tropasUsadas, toT);

  let newFromTroops = fromT.tropasAtuais - combatResult.atacantePerdas;
  let newToTroops = Math.max(0, toT.tropasAtuais - combatResult.defensorPerdas);

  let description = `${player.name} atacou ${toT.name} a partir de ${fromT.name} com ${tropasUsadas} tropa(s). `;
  description += `Força: Atacante ${combatResult.forcaAtacante} vs Defensor ${combatResult.forcaDefensor}. `;
  description += `(Atq: ${tropasUsadas} tropas + dado ${combatResult.dadoAtacante}; `;
  description += `Def: ${toT.tropasAtuais} tropas + defesa ${toT.defesaNatural} + fe ${combatResult.bonusFe} + base 1 + dado ${combatResult.dadoDefensor}). `;
  description += `Resultado: ${combatResult.tipoVitoria}. `;
  description += `Perdas: Atacante -${combatResult.atacantePerdas}, Defensor -${combatResult.defensorPerdas}.`;

  let updatedTerritories = state.territories.map((t) => {
    if (t.id === fromId) {
      return { ...t, tropasAtuais: newFromTroops };
    }
    if (t.id === toId) {
      return { ...t, tropasAtuais: newToTroops };
    }
    return t;
  });

  if (combatResult.conquistou) {
    const tropasOcupantes = Math.max(1, tropasUsadas - combatResult.atacantePerdas);
    newFromTroops = Math.max(1, newFromTroops - tropasOcupantes);
    const legacyGained = getLegacyForConquest(toT);
    
    updatedTerritories = updatedTerritories.map((t) => {
      if (t.id === fromId) {
        return { ...t, tropasAtuais: newFromTroops };
      }
      if (t.id === toId) {
        let conquered: Territory = {
          ...t,
          donoAtual: playerId as string,
          tropasAtuais: tropasOcupantes,
          estado: "instavel" as const,
          bloqueado: false,
        };
        conquered = applyFaithChange(conquered, -20);
        return conquered;
      }
      return t;
    });

    description += ` ${toT.name} foi conquistado! +${legacyGained} Legado.`;
  }

  const legacyGained = combatResult.conquistou ? getLegacyForConquest(toT) : 0;
  const updatedPlayers =
    legacyGained > 0
      ? state.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                resources: {
                  ...p.resources,
                  legado: p.resources.legado + legacyGained,
                },
              }
            : p,
        )
      : state.players;

  const updatedState = recordAction(
    {
      ...state,
      territories: updatedTerritories,
      players: updatedPlayers,
      log: [...state.log, description],
    },
    "ATACAR",
    description
  );

  return { valid: true, state: updatedState, combatResult };
}

// ─── Influence Territory ──────────────────────────────────────────────────────

export interface InfluenceActionResult extends ActionResult {
  influenceResult?: InfluenceResult;
}

/**
 * Tentar influência em território:
 * - Território alvo deve ser neutro ou inimigo
 * - Território alvo deve ser adjacente a território do jogador
 * - Jogador escolhe quanto de influência e ouro investir
 * - Resolve teste de influência
 * - Aplica efeitos conforme resultado
 * - Custa 1 ação
 */
export function influenceTerritory(
  state: GameState,
  playerId: PlayerId,
  fromId: TerritoryId,
  toId: TerritoryId,
  influenciaInvestida: number,
  ouroInvestido: number
): InfluenceActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const fromT = state.territories.find((t) => t.id === fromId);
  const toT = state.territories.find((t) => t.id === toId);
  const player = state.players.find((p) => p.id === playerId);

  if (!fromT || !toT || !player) {
    return { valid: false, reason: "Território não encontrado.", state };
  }

  if (fromT.donoAtual !== playerId) {
    return { valid: false, reason: "Você não controla o território de origem.", state };
  }
  if (toT.donoAtual === playerId) {
    return { valid: false, reason: "Você já controla o território alvo.", state };
  }
  if (!fromT.connections.includes(toId)) {
    return { valid: false, reason: "Territórios não são adjacentes.", state };
  }
  if (influenciaInvestida < 1) {
    return { valid: false, reason: "Invista ao menos 1 de influência.", state };
  }
  if (player.resources.influencia < influenciaInvestida) {
    return { valid: false, reason: "Influência insuficiente.", state };
  }
  if (ouroInvestido > 0 && player.resources.ouro < ouroInvestido) {
    return { valid: false, reason: "Ouro insuficiente.", state };
  }
  if (ouroInvestido > 4) {
    return { valid: false, reason: "Máximo de 4 ouro pode ser investido (bônus limitado a +2).", state };
  }

  const influenceResult = resolveInfluence(influenciaInvestida, ouroInvestido, toT);

  const isNeutral = toT.donoAtual === null;
  const isRebel = toT.feAtual <= 19;

  let description = `${player.name} tentou influência em ${toT.name}. `;
  description += `Força: ${influenceResult.forcaAtacante} vs Resistência: ${influenceResult.resistenciaDefensor}. `;
  description += influenceResult.sucesso ? "Sucesso!" : "Falhou.";

  let updatedTerritories = [...state.territories];
  let updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        resources: {
          ...p.resources,
          influencia: p.resources.influencia - influenciaInvestida,
          ouro: p.resources.ouro - ouroInvestido,
        },
      };
    }
    return p;
  });
  let legacyGained = 0;

  if (isNeutral) {
    if (influenceResult.dominou) {
      legacyGained = getLegacyForConquest(toT);
      updatedTerritories = updatedTerritories.map((t) => {
        if (t.id === toId) {
          let dominated: Territory = {
            ...t,
            donoAtual: playerId as string,
            tropasAtuais: 1,
            estado: "instavel" as const,
            marcadoresInfluencia: 0,
            marcadoresPressao: 0,
            bloqueado: false,
          };
          dominated = applyFaithChange(dominated, -20);
          return dominated;
        }
        return t;
      });
      description += ` ${toT.name} foi dominado! +${legacyGained} Legado.`;
    } else {
      updatedTerritories = updatedTerritories.map((t) => {
        if (t.id === toId) {
          return {
            ...t,
            marcadoresInfluencia: influenceResult.sucessosAcumulados,
          };
        }
        return t;
      });
      if (influenceResult.sucesso) {
        description += ` Sucessos: ${influenceResult.sucessosAcumulados}/${influenceResult.sucessosNecessarios}.`;
      }
    }
  } else {
    if (isRebel && influenceResult.sucesso) {
      legacyGained = getLegacyForConquest(toT);
      updatedTerritories = updatedTerritories.map((t) => {
        if (t.id === toId) {
          let dominated: Territory = {
            ...t,
            donoAtual: playerId as string,
            tropasAtuais: 1,
            estado: "instavel" as const,
            marcadoresInfluencia: 0,
            marcadoresPressao: 0,
            bloqueado: false,
          };
          dominated = applyFaithChange(dominated, -20);
          return dominated;
        }
        return t;
      });
      description += ` ${toT.name} estava rebelde e foi dominado! +${legacyGained} Legado.`;
    } else {
      updatedTerritories = updatedTerritories.map((t) => {
        if (t.id === toId) {
          let updated = { ...t };
          if (influenceResult.sucesso) {
            updated = applyFaithChange(updated, -influenceResult.reducaoFe);
            updated.marcadoresPressao = influenceResult.marcadoresPressao;
            if (influenceResult.ficouPressionado) {
              updated.estado = "pressionado" as const;
            }
          }
          return updated;
        }
        return t;
      });
      if (influenceResult.sucesso) {
        description += ` Fé reduzida em ${influenceResult.reducaoFe}. Pressão: ${influenceResult.marcadoresPressao}.`;
        if (influenceResult.ficouPressionado) {
          description += ` ${toT.name} está pressionado!`;
        }
      }
    }
  }

  if (legacyGained > 0) {
    updatedPlayers = updatedPlayers.map((p) =>
      p.id === playerId
        ? {
            ...p,
            resources: {
              ...p.resources,
              legado: p.resources.legado + legacyGained,
            },
          }
        : p,
    );
  }

  const updatedState = recordAction(
    {
      ...state,
      territories: updatedTerritories,
      players: updatedPlayers,
      log: [...state.log, description],
    },
    "INFLUENCIAR",
    description
  );

  return { valid: true, state: updatedState, influenceResult };
}

// ─── Buy Random Card ──────────────────────────────────────────────────────────

/**
 * Comprar carta aleatória do baralho por 2 ouro.
 * Custa 1 ação.
 */
export function buyRandomCardAction(
  state: GameState,
  playerId: PlayerId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, reason: "Jogador não encontrado.", state };
  }

  if (!canBuyCard(player.cartasNaMao)) {
    return { valid: false, reason: "Mão cheia! Máximo de 5 cartas. Descarte uma carta primeiro.", state };
  }

  if (player.resources.ouro < 2) {
    return { valid: false, reason: "Ouro insuficiente. Custo: 2 ouro.", state };
  }

  if (state.deck.length === 0) {
    return { valid: false, reason: "Baralho vazio.", state };
  }

  const { card, newDeck } = buyRandomCard(state);
  if (!card) {
    return { valid: false, reason: "Não foi possível comprar carta.", state };
  }

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        resources: { ...p.resources, ouro: p.resources.ouro - 2 },
        cartasNaMao: [...p.cartasNaMao, card],
      };
    }
    return p;
  });

  const description = `${player.name} comprou carta aleatória: ${card.name}.`;

  const updatedState = recordAction(
    {
      ...state,
      deck: newDeck,
      players: updatedPlayers,
      log: [...state.log, description],
    },
    "COMPRAR_CARTA",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Buy Market Card ──────────────────────────────────────────────────────────

/**
 * Comprar carta específica do mercado por 4 ouro.
 * Custa 1 ação.
 */
export function buyMarketCardAction(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, reason: "Jogador não encontrado.", state };
  }

  if (!canBuyCard(player.cartasNaMao)) {
    return { valid: false, reason: "Mão cheia! Máximo de 5 cartas. Descarte uma carta primeiro.", state };
  }

  if (player.resources.ouro < 4) {
    return { valid: false, reason: "Ouro insuficiente. Custo: 4 ouro.", state };
  }

  const { card, newMercado } = buyMarketCard(state, cardId);
  if (!card) {
    return { valid: false, reason: "Carta não encontrada no mercado.", state };
  }

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        resources: { ...p.resources, ouro: p.resources.ouro - 4 },
        cartasNaMao: [...p.cartasNaMao, card],
      };
    }
    return p;
  });

  let updatedState = {
    ...state,
    mercado: newMercado,
    players: updatedPlayers,
  };

  updatedState = refillMarket(updatedState);

  const description = `${player.name} comprou ${card.name} do mercado.`;

  updatedState = recordAction(
    {
      ...updatedState,
      log: [...updatedState.log, description],
    },
    "COMPRAR_CARTA",
    description
  );

  return { valid: true, state: updatedState };
}

// ─── Activate Character ───────────────────────────────────────────────────────

/**
 * Ativar personagem da mão.
 * Jogador pode ter apenas 1 personagem ativo por vez.
 * Personagens são únicos enquanto ativos.
 */
export function activateCharacter(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId
): ActionResult {
  const turnError = validateTurn(state, playerId);
  if (turnError) return { valid: false, reason: turnError, state };

  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, reason: "Jogador não encontrado.", state };
  }

  const card = player.cartasNaMao.find((c) => c.id === cardId);
  if (!card) {
    return { valid: false, reason: "Carta não encontrada na mão.", state };
  }

  if (card.type !== "personagem") {
    return { valid: false, reason: "Apenas personagens podem ser ativados.", state };
  }

  if (player.personagemAtivo !== null) {
    return { valid: false, reason: "Você já tem um personagem ativo. Aguarde ele expirar.", state };
  }

  if (isCharacterActive(state, cardId)) {
    return { valid: false, reason: "Este personagem já está ativo em outro jogador.", state };
  }

  const duration = card.effects.find((e) => e.duration)?.duration || 2;

  const activeCharacter: ActiveCharacter = {
    cardId: card.id,
    roundsRemaining: duration,
    usedThisTurn: false,
  };

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        personagemAtivo: activeCharacter,
        cartasNaMao: p.cartasNaMao.filter((c) => c.id !== cardId),
      };
    }
    return p;
  });

  const description = `${player.name} ativou ${card.name}!`;

  const updatedState = recordAction(
    {
      ...state,
      players: updatedPlayers,
      log: [...state.log, description],
    },
    "ATIVAR_PERSONAGEM",
    description
  );

  return { valid: true, state: updatedState };
}
