
import type { CombatResult, Territory, FaithLevel } from "@/types";
import { getTerritoryFaithStatus } from "./faith";

/**
 * Resolve combate entre atacante e defensor conforme as regras do jogo.
 * 
 * Cálculo:
 * - Atacante: tropas usadas + bônus + dado d6
 * - Defensor: tropas defensoras + defesa natural + bônus de fé + bônus defensivo base (+1) + dado d6
 * 
 * Empate favorece o defensor.
 * 
 * Tabela de perdas:
 * - Diferença 0 ou empate: atacante -2, defensor -1
 * - Diferença 1-2: vencedor -1, perdedor -2
 * - Diferença 3-5: vencedor -1, perdedor -3
 * - Diferença 6+: vencedor -0, perdedor -4
 * 
 * Pure function — no side effects.
 */
export function resolveCombat(
  tropasAtacantes: number,
  territorioDefensor: Territory,
  bonusAtacante: number = 0,
  bonusDefensorExtra: number = 0
): CombatResult {
  // Bônus de fé na defesa
  const bonusFe = getBonusFePorNivel(getTerritoryFaithStatus(territorioDefensor.feAtual));
  
  // Rolar dados
  const dadoAtacante = rolarDado();
  const dadoDefensor = rolarDado();
  
  // Calcular forças
  const forcaAtacante = tropasAtacantes + bonusAtacante + dadoAtacante;
  const forcaDefensor = 
    territorioDefensor.tropasAtuais + 
    territorioDefensor.defesaNatural + 
    bonusFe + 
    1 + // bônus defensivo base
    bonusDefensorExtra +
    dadoDefensor;
  
  // Determinar vencedor e diferença
  let vencedor: 'atacante' | 'defensor' | 'empate';
  let diferenca: number;
  
  if (forcaAtacante > forcaDefensor) {
    vencedor = 'atacante';
    diferenca = forcaAtacante - forcaDefensor;
  } else if (forcaDefensor > forcaAtacante) {
    vencedor = 'defensor';
    diferenca = forcaDefensor - forcaAtacante;
  } else {
    // Empate favorece o defensor
    vencedor = 'empate';
    diferenca = 0;
  }
  
  // Calcular perdas conforme tabela
  const { atacantePerdas, defensorPerdas, tipoVitoria } = calcularPerdas(vencedor, diferenca);
  
  // Verificar se conquistou (tropas defensoras chegam a 0)
  const tropasDefensorasRestantes = territorioDefensor.tropasAtuais - defensorPerdas;
  const conquistou = tropasDefensorasRestantes <= 0;
  
  return {
    atacantePerdas,
    defensorPerdas,
    conquistou,
    dadoAtacante,
    dadoDefensor,
    forcaAtacante,
    forcaDefensor,
    diferenca,
    vencedor,
    tipoVitoria,
    bonusFe,
  };
}

/**
 * Retorna o bônus de fé na defesa conforme o nível de fé do território.
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
 * Calcula as perdas de tropas conforme a tabela de perdas.
 */
function calcularPerdas(
  vencedor: 'atacante' | 'defensor' | 'empate',
  diferenca: number
): {
  atacantePerdas: number;
  defensorPerdas: number;
  tipoVitoria: 'empate' | 'apertada' | 'clara' | 'esmagadora';
} {
  // Empate ou diferença 0: defensor segura
  if (vencedor === 'empate' || diferenca === 0) {
    return {
      atacantePerdas: 2,
      defensorPerdas: 1,
      tipoVitoria: 'empate',
    };
  }
  
  // Diferença 1-2: vitória apertada
  if (diferenca <= 2) {
    return {
      atacantePerdas: vencedor === 'atacante' ? 1 : 2,
      defensorPerdas: vencedor === 'defensor' ? 1 : 2,
      tipoVitoria: 'apertada',
    };
  }
  
  // Diferença 3-5: vitória clara
  if (diferenca <= 5) {
    return {
      atacantePerdas: vencedor === 'atacante' ? 1 : 3,
      defensorPerdas: vencedor === 'defensor' ? 1 : 3,
      tipoVitoria: 'clara',
    };
  }
  
  // Diferença 6+: vitória esmagadora
  return {
    atacantePerdas: vencedor === 'atacante' ? 0 : 4,
    defensorPerdas: vencedor === 'defensor' ? 0 : 4,
    tipoVitoria: 'esmagadora',
  };
}

/**
 * Rola um dado de 6 faces (1-6).
 */
function rolarDado(): number {
  return Math.floor(Math.random() * 6) + 1;
}
