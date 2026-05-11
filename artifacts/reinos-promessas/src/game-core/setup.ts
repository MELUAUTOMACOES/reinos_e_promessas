import type {
  GameState,
  NewGameConfig,
  Player,
  Territory,
  TurnState,
  Card,
} from "@/types";
import { TERRITORIES } from "@/game-data/territories";
import { REGIONS } from "@/game-data/regions";
import { CARDS } from "@/game-data/cards";
import { FACTIONS } from "@/game-data/factions";
import { STARTING_PACKS } from "@/game-data/startingPacks";
import { getRandomObjective } from "@/game-data/objectives";
import { shuffleDeck } from "./cards";
import { updateTerritoryState } from "./faith";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Each player starts with exactly this resource allocation */
const STARTING_RESOURCES = {
  provisao: 4,
  ouro: 3,
  influencia: 2,
  legado: 0,
};

/** Total troops each player distributes between their 2 starting territories */
const STARTING_TROOPS = 8;

/** Troops per starting territory (STARTING_TROOPS / 2) */
const TROOPS_PER_STARTING_TERRITORY = STARTING_TROOPS / 2; // = 4

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── createNewGame ────────────────────────────────────────────────────────────

/**
 * Creates a fresh GameState from a NewGameConfig.
 *
 * Rules:
 * - Each player gets STARTING_RESOURCES.
 * - Each player gets 2 territories from their chosen pack.
 * - Neutral troops on those territories are removed.
 * - 4 troops are placed in each starting territory (4+4 = 8 total).
 * - Territory faith and estado are initialized from feBase.
 * - Blocked territories stay neutral and are not assigned.
 *
 * Pure function — no side effects.
 */
export function createNewGame(config: NewGameConfig): GameState {
  const { mode, players: playerConfigs } = config;

  // ── Build faction lookup ──────────────────────────────────────────────────
  const factionMap = new Map(FACTIONS.map((f) => [f.id, f]));

  // ── Build pack lookup ─────────────────────────────────────────────────────
  const packMap = new Map(STARTING_PACKS.map((p) => [p.id, p]));

  // ── Validate no duplicate packs ───────────────────────────────────────────
  const usedPacks = new Set<string>();
  for (const pc of playerConfigs) {
    if (usedPacks.has(pc.packId)) {
      throw new Error(`Pack "${pc.packId}" escolhido por mais de um jogador.`);
    }
    usedPacks.add(pc.packId);
  }

  // ── Build initial territory map ───────────────────────────────────────────
  const territories: Territory[] = TERRITORIES.map((t) =>
    updateTerritoryState({
      ...t,
      tropasAtuais: t.tropasNeutrasIniciais,
      feAtual: t.feBase,
      donoAtual: null as string | null,
      estado: "neutro" as const,
      melhorias: [],
    })
  );
  const territoryMap = new Map(territories.map((t) => [t.id, t]));

  // ── Create players and assign starting territories ────────────────────────
  const players: Player[] = playerConfigs.map((pc, index) => {
    const faction = factionMap.get(pc.factionId);
    const pack = packMap.get(pc.packId);

    if (!faction) throw new Error(`Facção "${pc.factionId}" não encontrada.`);
    if (!pack) throw new Error(`Pacote "${pc.packId}" não encontrado.`);

    // Assign territories to this player
    for (const tid of pack.territoryIds) {
      const territory = territoryMap.get(tid);
      if (!territory) continue;
      if (territory.bloqueado) continue; // skip blocked territories

      const playerId = `player_${index}`;
      const updated = updateTerritoryState({
        ...territory,
        donoAtual: playerId,
        tropasAtuais: TROOPS_PER_STARTING_TERRITORY,
        estado: "controlado" as const,
      });
      territoryMap.set(tid, updated);
    }

    // Sortear objetivo secreto tier médio
    const objective = getRandomObjective("medio");

    return {
      id: `player_${index}`,
      name: pc.name,
      color: faction.color,
      faction: faction.name,
      resources: { ...STARTING_RESOURCES },
      cartasNaMao: [],
      objetivoSecretoId: objective.id,
      personagemAtivo: null,
      missoesCompletadas: [],
      isBot: pc.isBot,
      botDifficulty: pc.botDifficulty ?? null,
    };
  });

  // ── Initial turn state ────────────────────────────────────────────────────
  const firstPlayer = players[0];
  const initialTurn: TurnState = {
    rodada: 1,
    fase: "producao",
    jogadorAtualId: firstPlayer.id,
    indiceJogadorAtual: 0,
    acoesRestantes: 3,
    territoriosMovidosNesteturno: [],
    atacouNesteturno: false,
    historicoAcoes: [],
  };

  // ── Shuffle deck and setup market ────────────────────────────────────────
  const shuffledDeck = shuffleDeck(CARDS);
  const mercado = shuffledDeck.slice(0, 3);
  const deck = shuffledDeck.slice(3);

  return {
    id: `game_${Date.now()}`,
    mode,
    turno: initialTurn,
    players,
    territories: [...territoryMap.values()],
    regions: REGIONS,
    deck,
    descarte: [],
    mercado,
    vencedor: null,
    log: [
      `Partida iniciada! Modo: ${mode === "padrao" ? "Padrão (150 Legado)" : "Rápido (100 Legado)"}.`,
      `${firstPlayer.name} começa a primeira rodada.`,
      `Cada jogador recebeu um objetivo secreto.`,
    ],
    savedAt: null,
  };
}
