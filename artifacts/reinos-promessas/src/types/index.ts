
// ─── Player ──────────────────────────────────────────────────────────────────

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  /** Faction/kingdom name (e.g. "Israel", "Judá", "Filisteus") */
  faction: string;
  resources: Resources;
  faith: number;       // 0–100, affects special abilities
  stability: number;   // 0–100, affects revolt/defection risk
  isBot: boolean;
  secretObjectiveId: string | null;
}

// ─── Resources ───────────────────────────────────────────────────────────────

export interface Resources {
  gold: number;
  food: number;
  faith: number;
}

// ─── Territory ───────────────────────────────────────────────────────────────

export type TerritoryId = string;

export interface Territory {
  id: TerritoryId;
  name: string;
  regionId: RegionId;
  /** IDs of adjacent territories */
  adjacentIds: TerritoryId[];
  /** Player who currently controls this territory (null = neutral) */
  ownerId: PlayerId | null;
  armies: number;
  /** Bonus production when held */
  resourceBonus: Partial<Resources>;
  /** Pixel position for map rendering */
  position: { x: number; y: number };
}

// ─── Region ──────────────────────────────────────────────────────────────────

export type RegionId = string;

export interface Region {
  id: RegionId;
  name: string;
  territoryIds: TerritoryId[];
  /** Bonus granted to player who controls all territories in the region */
  controlBonus: Partial<Resources>;
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export type CardId = string;

export type CardType = "event" | "blessing" | "curse" | "army" | "prophecy";

export interface Card {
  id: CardId;
  name: string;
  type: CardType;
  description: string;
  /** Effect applied when played — resolved by game-core */
  effectKey: string;
}

// ─── Objectives ──────────────────────────────────────────────────────────────

export type ObjectiveId = string;

export interface SecretObjective {
  id: ObjectiveId;
  description: string;
  /** Condition evaluated by game-core/victory.ts */
  conditionKey: string;
  victoryPoints: number;
}

// ─── Turn / Phase ─────────────────────────────────────────────────────────────

export type GamePhase =
  | "setup"
  | "production"
  | "cards"
  | "movement"
  | "combat"
  | "end_turn";

// ─── Combat ──────────────────────────────────────────────────────────────────

export interface CombatResult {
  attackerLosses: number;
  defenderLosses: number;
  attackerWon: boolean;
  rolls: { attacker: number[]; defender: number[] };
}

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  id: string;
  phase: GamePhase;
  turn: number;
  currentPlayerId: PlayerId;
  players: Player[];
  territories: Territory[];
  regions: Region[];
  deck: Card[];
  discard: Card[];
  hands: Record<PlayerId, Card[]>;
  winner: PlayerId | null;
  log: string[];
  /** ISO timestamp of last save */
  savedAt: string | null;
}

// ─── Store Actions ───────────────────────────────────────────────────────────

export type GameAction =
  | { type: "START_GAME"; playerCount: number }
  | { type: "ADVANCE_PHASE" }
  | { type: "MOVE_ARMIES"; from: TerritoryId; to: TerritoryId; count: number }
  | { type: "ATTACK"; from: TerritoryId; to: TerritoryId; armies: number }
  | { type: "PLAY_CARD"; cardId: CardId }
  | { type: "END_TURN" }
  | { type: "SAVE_GAME" }
  | { type: "LOAD_GAME" }
  | { type: "RESET_GAME" };
