
export { resolveCombat } from "./combat";
export { canMove, canAttack, findReachable } from "./movement";
export { calculateProduction, applyProduction, calculateReinforcements } from "./resources";
export { advancePhase, getNextPlayerId } from "./turn";
export { checkVictory } from "./victory";
export type { VictoryCheck } from "./victory";
export {
  getFaithLevel,
  getFaithInfo,
  calculateEffectiveDefense,
  applyFaithChange,
  faithOnConquest,
  decayFaithTowardBase,
  FAITH_LEVEL_INFO,
} from "./faith";
export type { FaithLevelInfo } from "./faith";
