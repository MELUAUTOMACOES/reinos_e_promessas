
// ── Setup ────────────────────────────────────────────────────────────────────
export { createNewGame } from "./setup";

// ── Turn ─────────────────────────────────────────────────────────────────────
export { startTurn, endTurn, advancePhase, recordAction, getNextPlayerId } from "./turn";

// ── Actions ──────────────────────────────────────────────────────────────────
export { recruitTroops, moveTroops, strengthenFaith, discardCard } from "./actions";
export type { ActionResult } from "./actions";

// ── Resources ────────────────────────────────────────────────────────────────
export {
  getTroopLimit,
  applyResourceLimits,
  calculateTerritoryProduction,
  calculatePlayerProduction,
  applyProduction,
  calculateReinforcements,
} from "./resources";
export type { ProductionResult } from "./resources";

// ── Faith ────────────────────────────────────────────────────────────────────
export {
  getTerritoryFaithStatus,
  getFaithLevel,
  getFaithInfo,
  updateTerritoryState,
  deriveTerritoryControlState,
  calculateEffectiveDefense,
  applyFaithChange,
  faithOnConquest,
  decayFaithTowardBase,
  FAITH_LEVEL_INFO,
} from "./faith";
export type { FaithLevelInfo } from "./faith";

// ── Combat ───────────────────────────────────────────────────────────────────
export { resolveCombat } from "./combat";

// ── Movement ─────────────────────────────────────────────────────────────────
export { canMove, canAttack, findReachable } from "./movement";

// ── Victory ──────────────────────────────────────────────────────────────────
export { checkVictory } from "./victory";
export type { VictoryCheck } from "./victory";

// ── Bot ──────────────────────────────────────────────────────────────────────
export { decideBotAction } from "./bot";
export type { BotActionResult } from "./bot";
