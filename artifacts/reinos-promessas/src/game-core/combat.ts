
import type { CombatResult, Territory } from "@/types";
import { calculateEffectiveDefense } from "./faith";

/**
 * Simulates a combat round between attacker and defender.
 * Uses dice-based resolution with faith-adjusted defense.
 * Pure function — no side effects.
 */
export function resolveCombat(
  atacanteTropas: number,
  territory: Territory
): CombatResult {
  const defesaEfetiva = calculateEffectiveDefense(territory);
  const defensorTropas = territory.tropasAtuais;

  const atacanteDados = Math.min(atacanteTropas, 3);
  const defensorDados = Math.min(defensorTropas + defesaEfetiva - territory.defesaNatural, 2);
  const defensorDadosReal = Math.max(1, Math.min(defensorDados, 2));

  const rolagemAtacante = rolarDados(atacanteDados).sort((a, b) => b - a);
  const rolagemDefensor = rolarDados(defensorDadosReal).sort((a, b) => b - a);

  let atacantePerdas = 0;
  let defensorPerdas = 0;

  const comparacoes = Math.min(rolagemAtacante.length, rolagemDefensor.length);
  for (let i = 0; i < comparacoes; i++) {
    if (rolagemAtacante[i] > rolagemDefensor[i]) {
      defensorPerdas++;
    } else {
      atacantePerdas++;
    }
  }

  return {
    atacantePerdas,
    defensorPerdas,
    atacanteVenceu: defensorTropas - defensorPerdas <= 0,
    rolls: { atacante: rolagemAtacante, defensor: rolagemDefensor },
  };
}

function rolarDados(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}
