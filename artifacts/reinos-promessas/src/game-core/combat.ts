
import type { CombatResult } from "@/types";

/**
 * Simulates a single combat round between attacker and defender armies.
 * Uses dice-based resolution similar to Risk/War board games.
 * Pure function — no side effects.
 */
export function resolveCombat(
  attackerArmies: number,
  defenderArmies: number
): CombatResult {
  const attackDice = Math.min(attackerArmies, 3);
  const defenseDice = Math.min(defenderArmies, 2);

  const attackRolls = rollDice(attackDice).sort((a, b) => b - a);
  const defenseRolls = rollDice(defenseDice).sort((a, b) => b - a);

  let attackerLosses = 0;
  let defenderLosses = 0;

  const comparisons = Math.min(attackRolls.length, defenseRolls.length);
  for (let i = 0; i < comparisons; i++) {
    if (attackRolls[i] > defenseRolls[i]) {
      defenderLosses++;
    } else {
      attackerLosses++;
    }
  }

  return {
    attackerLosses,
    defenderLosses,
    attackerWon: defenderArmies - defenderLosses <= 0,
    rolls: { attacker: attackRolls, defender: defenseRolls },
  };
}

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}
