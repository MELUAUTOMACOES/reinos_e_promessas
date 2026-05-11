
// ─── Enums / Union types ─────────────────────────────────────────────────────

export type TerritoryType = "comum" | "estrategico" | "sagrado" | "capital";

export type TerritoryControlState =
  | "neutro"
  | "controlado"
  | "instavel"
  | "pressionado"
  | "rebelde";

export type FaithLevel = "rebelde" | "fraco" | "estavel" | "forte" | "fiel";

export type BotDifficulty = "facil" | "medio" | "dificil";

export type GameMode = "rapido" | "padrao";

export type TurnPhase =
  | "setup"
  | "producao"
  | "cartas"
  | "movimento"
  | "combate"
  | "fim_turno";

export type ActionType =
  | "INICIAR_PARTIDA"
  | "AVANCAR_FASE"
  | "MOVER_TROPAS"
  | "ATACAR"
  | "JOGAR_CARTA"
  | "ENCERRAR_TURNO"
  | "SALVAR_PARTIDA"
  | "RESETAR_PARTIDA";

// ─── IDs ─────────────────────────────────────────────────────────────────────

export type TerritoryId = string;
export type RegionId = string;
export type PlayerId = string;
export type CardId = string;
export type ObjectiveId = string;
export type PackId = string;

// ─── Resource limits & troop limits ──────────────────────────────────────────

export const RESOURCE_LIMITS = {
  provisao: 12,
  ouro: 10,
  influencia: 8,
} as const;

export const TROOP_LIMITS: Record<TerritoryType, number> = {
  comum: 6,
  estrategico: 8,
  sagrado: 10,
  capital: 12,
};

// ─── Resources ───────────────────────────────────────────────────────────────

export interface ResourceState {
  /** Alimento / mantimento das tropas */
  provisao: number;
  /** Moeda para recrutamento e melhorias */
  ouro: number;
  /** Poder político, diplomacia e aliança */
  influencia: number;
  /** Pontuação de longo prazo / condição de vitória */
  legado: number;
}

// ─── Territory Improvements ──────────────────────────────────────────────────

export type TerritoryImprovement =
  | "fortaleza"
  | "templo"
  | "mercado"
  | "estrada"
  | "aqueduto";

// ─── Territory Production ────────────────────────────────────────────────────

export interface TerritoryProduction {
  provisao: number;
  ouro: number;
  influencia: number;
  /** Military production: troops added to this territory each turn (optional) */
  militar?: number;
}

// ─── Territory ───────────────────────────────────────────────────────────────

export interface Territory {
  id: TerritoryId;
  name: string;
  regionId: RegionId;
  type: TerritoryType;
  /** Pixel position for map rendering */
  position: { x: number; y: number };
  /** IDs of adjacent territories */
  connections: TerritoryId[];
  /** Bonus to defense rolls (1–5) */
  defesaNatural: number;
  /** Faith starting baseline (0–100) */
  feBase: number;
  /** Current faith value (0–100, runtime) */
  feAtual: number;
  /** Neutral troop count at game start */
  tropasNeutrasIniciais: number;
  /** Current troop count (runtime) */
  tropasAtuais: number;
  /** Player who currently owns this territory (null = neutral) */
  donoAtual: PlayerId | null;
  /** Control state — derived from ownership + faith */
  estado: TerritoryControlState;
  /** Whether the territory is locked at game start */
  bloqueado: boolean;
  /** Base resource production per turn */
  producao: TerritoryProduction;
  /** Active improvements */
  melhorias: TerritoryImprovement[];
  /** Thematic strength note */
  pontoForte: string;
  /** Thematic weakness note */
  pontoFraco: string;
  /** Biblical/historical context */
  descricao: string;
}

// ─── Region ──────────────────────────────────────────────────────────────────

export interface RegionBonus {
  provisao?: number;
  ouro?: number;
  influencia?: number;
  legado?: number;
}

export interface Region {
  id: RegionId;
  name: string;
  territoryIds: TerritoryId[];
  /** Bonus granted to player who controls ALL territories in the region */
  bonusControle: RegionBonus;
  description: string;
}

// ─── Starting Pack ───────────────────────────────────────────────────────────

export interface StartingPack {
  id: PackId;
  label: string;
  territoryIds: [TerritoryId, TerritoryId];
  description: string;
}

// ─── Cards ───────────────────────────────────────────────────────────────────

export type CardType = "evento" | "bencao" | "maldicao" | "exercito" | "profecia";

export interface Card {
  id: CardId;
  name: string;
  type: CardType;
  description: string;
  effectKey: string;
}

// ─── Objectives ──────────────────────────────────────────────────────────────

export interface SecretObjective {
  id: ObjectiveId;
  description: string;
  conditionKey: string;
  victoryPoints: number;
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  faction: string;
  resources: ResourceState;
  cartasNaMao: Card[];
  objetivoSecretoId: ObjectiveId | null;
  personagemAtivo: string | null;
  isBot: boolean;
  botDifficulty: BotDifficulty | null;
}

// ─── New Game Config ──────────────────────────────────────────────────────────

export interface NewGamePlayerConfig {
  name: string;
  factionId: string;
  packId: PackId;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
}

export interface NewGameConfig {
  mode: GameMode;
  players: NewGamePlayerConfig[];
}

// ─── Turn Action Log ──────────────────────────────────────────────────────────

export interface TurnAction {
  type: ActionType;
  description: string;
  timestamp: number;
}

// ─── Turn State ──────────────────────────────────────────────────────────────

export interface TurnState {
  rodada: number;
  fase: TurnPhase;
  jogadorAtualId: PlayerId;
  indiceJogadorAtual: number;
  /** Remaining player actions this turn (starts at 3) */
  acoesRestantes: number;
  /** Territories already moved from this turn */
  territoriosMovidosNesteturno: TerritoryId[];
  /** Whether the player already attacked this turn */
  atacouNesteturno: boolean;
  /** Log of actions taken this turn */
  historicoAcoes: TurnAction[];
}

// ─── Game Mode Config ─────────────────────────────────────────────────────────

export interface GameModeConfig {
  mode: GameMode;
  legadoMaximo: number;
  label: string;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  rapido: { mode: "rapido", legadoMaximo: 100, label: "Partida Rápida" },
  padrao: { mode: "padrao", legadoMaximo: 150, label: "Partida Padrão" },
};

// ─── Combat ──────────────────────────────────────────────────────────────────

export interface CombatResult {
  atacantePerdas: number;
  defensorPerdas: number;
  atacanteVenceu: boolean;
  rolls: { atacante: number[]; defensor: number[] };
}

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  id: string;
  mode: GameMode;
  turno: TurnState;
  players: Player[];
  territories: Territory[];
  regions: Region[];
  deck: Card[];
  descarte: Card[];
  vencedor: PlayerId | null;
  log: string[];
  savedAt: string | null;
}
