
import type { InfluenceResult, Territory, TerritoryType, FaithLevel } from "@/types";
import { getTerritoryFaithStatus } from "./faith";

/**
 * Resolve tentativa de influência em um território.
 * 
 * Contra território neutro:
 * - Acumula sucessos até atingir o necessário
 * - Quando atingir, domina o território
 * 
 * Contra território inimigo:
 * - Cada sucesso reduz -10 fé
 * - Adiciona marcador de pressão
 * - Se rebelde + sucesso: domina o território
 * 
 * Pure function — no side effects.
 */
export function resolveInfluence(
  influenciaInvestida: number,
  ouroInvestido: number,
  territorio: Territory
): InfluenceResult {
  // Calcular bônus de ouro (cada 2 ouro = +1, máximo +2)
  const bonusOuro = Math.min(2, Math.floor(ouroInvestido / 2));
  
  // Rolar dados
  const dadoAtacante = rolarDado();
  const dadoDefensor = rolarDado();
  
  // Resistência base por tipo
  const resistenciaBase = getResistenciaBase(territorio.type);
  
  // Bônus de fé na resistência
  const bonusFe = getBonusFePorNivel(getTerritoryFaithStatus(territorio.feAtual));
  
  // Vulnerabilidade extra se território rebelde (+2 para atacante)
  const vulnerabilidadeRebelde = territorio.feAtual <= 19 ? 2 : 0;
  
  // Calcular forças
  const forcaAtacante = influenciaInvestida + bonusOuro + dadoAtacante + vulnerabilidadeRebelde;
  const resistenciaDefensor = resistenciaBase + bonusFe + dadoDefensor;
  
  // Determinar sucesso
  const sucesso = forcaAtacante > resistenciaDefensor;
  
  // Sucessos necessários por tipo
  const sucessosNecessarios = getSucessosNecessarios(territorio.type);
  
  // Calcular sucessos acumulados
  let sucessosAcumulados = territorio.marcadoresInfluencia;
  if (sucesso) {
    sucessosAcumulados += 1;
  }
  
  // Verificar se dominou (apenas para território neutro)
  const isNeutral = territorio.donoAtual === null;
  const dominou = isNeutral && sucessosAcumulados >= sucessosNecessarios;
  
  // Para território inimigo: redução de fé e marcadores de pressão
  const isEnemy = !isNeutral;
  const reducaoFe = isEnemy && sucesso ? 10 : 0;
  
  let marcadoresPressao = territorio.marcadoresPressao;
  if (isEnemy && sucesso) {
    marcadoresPressao += 1;
  }
  
  const ficouPressionado = marcadoresPressao >= 2;
  
  return {
    influenciaInvestida,
    ouroInvestido,
    bonusOuro,
    dadoAtacante,
    dadoDefensor,
    forcaAtacante,
    resistenciaDefensor,
    resistenciaBase,
    bonusFe,
    sucesso,
    sucessosAcumulados,
    sucessosNecessarios,
    dominou,
    reducaoFe,
    marcadoresPressao,
    ficouPressionado,
    vulnerabilidadeRebelde,
  };
}

/**
 * Retorna a resistência base do território por tipo.
 */
function getResistenciaBase(tipo: TerritoryType): number {
  switch (tipo) {
    case "comum": return 2;
    case "estrategico": return 3;
    case "sagrado": return 4;
    case "capital": return 5;
  }
}

/**
 * Retorna os sucessos necessários para dominar por tipo.
 */
function getSucessosNecessarios(tipo: TerritoryType): number {
  switch (tipo) {
    case "comum": return 1;
    case "estrategico": return 2;
    case "sagrado": return 2; // + quiz obrigatório futuramente
    case "capital": return 3;
  }
}

/**
 * Retorna o bônus de fé na resistência conforme o nível de fé do território.
 * Mesmo cálculo do combate.
 */
function getBonusFePorNivel(nivel: FaithLevel): number {
  switch (nivel) {
    case "rebelde": return -2;
    case "fraco": return -1;
    case "estavel": return 0;
    case "forte": return 1;
    case "fiel": return 2;
  }
}

/**
 * Rola um dado de 6 faces (1-6).
 */
function rolarDado(): number {
  return Math.floor(Math.random() * 6) + 1;
}
