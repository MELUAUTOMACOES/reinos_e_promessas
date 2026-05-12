
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
  | "RECRUTAR"
  | "MOVER_TROPAS"
  | "FORTALECER_FE"
  | "INFLUENCIAR"
  | "ATACAR"
  | "JOGAR_CARTA"
  | "DESCARTAR_CARTA"
  | "COMPRAR_CARTA"
  | "ATIVAR_PERSONAGEM"
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
  /** Influence success markers (for neutral territories) */
  marcadoresInfluencia: number;
  /** Pressure markers from enemy influence (for owned territories) */
  marcadoresPressao: number;
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

export type CardType = "personagem" | "tatica" | "missao" | "evento";

export type CardRarity = "comum" | "incomum" | "raro" | "lendario";

export interface CardEffect {
  /** Tipo de efeito */
  type: string;
  /** Valor do efeito */
  value?: number;
  /** Duração em rodadas (para efeitos temporários) */
  duration?: number;
  /** Condição para ativar o efeito */
  condition?: string;
  /** Limite de uso por turno */
  usesPerTurn?: number;
}

export interface Card {
  id: CardId;
  name: string;
  type: CardType;
  rarity: CardRarity;
  description: string;
  /** Custo em ouro para comprar no mercado aberto */
  cost: number;
  /** Efeitos da carta */
  effects: CardEffect[];
  /** Se é carta única (personagens) */
  unique?: boolean;
  /** Pontos de legado que a missão concede */
  legacyPoints?: number;
  /** Condição para completar missão */
  missionCondition?: string;
}

// ─── Objectives ──────────────────────────────────────────────────────────────

export type ObjectiveTier = "medio" | "dificil";

export interface SecretObjective {
  id: ObjectiveId;
  name: string;
  description: string;
  tier: ObjectiveTier;
  conditionKey: string;
  /** Dados específicos necessários para validação */
  conditionData?: {
    territories?: string[];
    faithRequired?: number;
    resourcesRequired?: number;
    territoryCount?: number;
    faithLevel?: number;
    roundsRequired?: number;
  };
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface ActiveCharacter {
  /** ID da carta do personagem */
  cardId: CardId;
  /** Rodadas restantes de duração */
  roundsRemaining: number;
  /** Se o bônus principal já foi usado neste turno */
  usedThisTurn: boolean;
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  faction: string;
  resources: ResourceState;
  cartasNaMao: Card[];
  objetivoSecretoId: ObjectiveId | null;
  /** Personagem ativo com duração */
  personagemAtivo: ActiveCharacter | null;
  /** Missões completadas */
  missoesCompletadas: CardId[];
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
  /** Tropas perdidas pelo atacante */
  atacantePerdas: number;
  /** Tropas perdidas pelo defensor */
  defensorPerdas: number;
  /** Se o atacante conquistou o território (defensor chegou a 0 tropas) */
  conquistou: boolean;
  /** Resultado do dado do atacante (1-6) */
  dadoAtacante: number;
  /** Resultado do dado do defensor (1-6) */
  dadoDefensor: number;
  /** Força total do atacante (tropas + bônus + dado) */
  forcaAtacante: number;
  /** Força total do defensor (tropas + defesa + bônus + dado) */
  forcaDefensor: number;
  /** Diferença absoluta entre as forças */
  diferenca: number;
  /** Quem venceu: 'atacante' | 'defensor' | 'empate' */
  vencedor: 'atacante' | 'defensor' | 'empate';
  /** Tipo de vitória: 'empate' | 'apertada' | 'clara' | 'esmagadora' */
  tipoVitoria: 'empate' | 'apertada' | 'clara' | 'esmagadora';
  /** Bônus de fé aplicado na defesa */
  bonusFe: number;
}

// ─── Influence ───────────────────────────────────────────────────────────────

export interface InfluenceResult {
  /** Influência investida pelo jogador */
  influenciaInvestida: number;
  /** Ouro investido pelo jogador */
  ouroInvestido: number;
  /** Bônus de ouro (+1 por cada 2 ouro, máx +2) */
  bonusOuro: number;
  /** Resultado do dado do atacante (1-6) */
  dadoAtacante: number;
  /** Resultado do dado do defensor (1-6) */
  dadoDefensor: number;
  /** Força total do atacante (influência + bônus ouro + dado) */
  forcaAtacante: number;
  /** Resistência total do defensor (base + bônus fé + dado) */
  resistenciaDefensor: number;
  /** Resistência base do território por tipo */
  resistenciaBase: number;
  /** Bônus de fé/estabilidade na resistência */
  bonusFe: number;
  /** Se foi um sucesso (atacante venceu) */
  sucesso: boolean;
  /** Sucessos acumulados no território */
  sucessosAcumulados: number;
  /** Sucessos necessários para dominar */
  sucessosNecessarios: number;
  /** Se o território foi dominado */
  dominou: boolean;
  /** Redução de fé aplicada (para território inimigo) */
  reducaoFe: number;
  /** Marcadores de pressão adicionados (para território inimigo) */
  marcadoresPressao: number;
  /** Se território ficou pressionado (2+ marcadores) */
  ficouPressionado: boolean;
  /** Vulnerabilidade extra por território rebelde */
  vulnerabilidadeRebelde: number;
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
  /** Mercado com 3 cartas abertas */
  mercado: Card[];
  vencedor: PlayerId | null;
  log: string[];
  savedAt: string | null;
}
