
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, GameMode, PlayerId, TerritoryId, Territory } from "@/types";
import { TERRITORIES } from "@/game-data/territories";
import { REGIONS } from "@/game-data/regions";
import { CARDS } from "@/game-data/cards";
import { FACTIONS } from "@/game-data/factions";
import { advancePhase } from "@/game-core/turn";
import { checkVictory } from "@/game-core/victory";
import { resolveCombat } from "@/game-core/combat";
import { canAttack, canMove } from "@/game-core/movement";
import { faithOnConquest, decayFaithTowardBase } from "@/game-core/faith";

const STORAGE_KEY = "reinos-promessas-save";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createInitialGameState(playerCount: number, mode: GameMode = "padrao"): GameState {
  const factions = shuffleArray(FACTIONS).slice(0, playerCount);
  const players = factions.map((f, i) => ({
    id: `player_${i}`,
    name: f.name,
    color: f.color,
    faction: f.name,
    resources: { provisao: 5, ouro: 5, influencia: 3, legado: 0 },
    cartasNaMao: [] as typeof CARDS,
    objetivoSecretoId: null as null,
    personagemAtivo: null as null,
    isBot: i > 0,
    botDifficulty: i > 0 ? ("medio" as const) : null,
  }));

  // Reset territories to initial state
  const territories: Territory[] = TERRITORIES.map((t) => ({
    ...t,
    tropasAtuais: t.tropasNeutrasIniciais,
    feAtual: t.feBase,
    donoAtual: null as string | null,
    estado: "neutro" as const,
    melhorias: [],
  }));

  // Distribute non-blocked starting territories evenly
  const available = shuffleArray(
    territories.filter((t) => !t.bloqueado).map((t) => t.id)
  );
  const perPlayer = Math.floor(available.length / playerCount);

  for (let i = 0; i < playerCount; i++) {
    const slice = available.slice(i * perPlayer, (i + 1) * perPlayer);
    for (const tid of slice) {
      const t = territories.find((t) => t.id === tid);
      if (t) {
        t.donoAtual = players[i].id;
        t.tropasAtuais = 2;
        t.estado = "controlado";
      }
    }
  }

  return {
    id: `game_${Date.now()}`,
    mode,
    turno: {
      rodada: 1,
      fase: "producao",
      jogadorAtualId: players[0].id,
      territoriosMovidosNesteturno: [],
      atacouNesteturno: false,
    },
    players,
    territories,
    regions: REGIONS,
    deck: shuffleArray(CARDS),
    descarte: [],
    vencedor: null,
    log: ["A partida começou! Que Deus guie os seus passos."],
    savedAt: null,
  };
}

interface GameStore {
  game: GameState | null;
  startGame: (playerCount: number, mode?: GameMode) => void;
  resetGame: () => void;
  advancePhase: () => void;
  attack: (from: TerritoryId, to: TerritoryId, tropas: number) => void;
  moveArmies: (from: TerritoryId, to: TerritoryId, count: number) => void;
  endTurn: () => void;
  saveGame: () => void;
  hasSavedGame: () => boolean;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      startGame: (playerCount, mode = "padrao") => {
        set({ game: createInitialGameState(playerCount, mode) });
      },

      resetGame: () => set({ game: null }),

      advancePhase: () => {
        const { game } = get();
        if (!game) return;
        const next = advancePhase(game);
        const victoryCheck = checkVictory(next);
        set({
          game: victoryCheck.hasWinner
            ? { ...next, vencedor: victoryCheck.winnerId, log: [...next.log, victoryCheck.reason ?? ""] }
            : next,
        });
      },

      attack: (fromId, toId, tropas) => {
        const { game } = get();
        if (!game) return;

        const fromT = game.territories.find((t) => t.id === fromId);
        const toT = game.territories.find((t) => t.id === toId);
        if (!fromT || !toT) return;

        const { valid, reason } = canAttack(fromT, toT, game.turno.jogadorAtualId);
        if (!valid) {
          set({ game: { ...game, log: [...game.log, `Ataque inválido: ${reason}`] } });
          return;
        }

        const result = resolveCombat(tropas, toT);
        const territories = game.territories.map((t) => {
          if (t.id === fromId) {
            return { ...t, tropasAtuais: t.tropasAtuais - result.atacantePerdas };
          }
          if (t.id === toId) {
            const remaining = t.tropasAtuais - result.defensorPerdas;
            if (result.atacanteVenceu) {
              return faithOnConquest(
                { ...t, tropasAtuais: tropas - result.atacantePerdas },
                game.turno.jogadorAtualId
              );
            }
            return { ...t, tropasAtuais: Math.max(1, remaining) };
          }
          return t;
        });

        const attacker = game.players.find((p) => p.id === game.turno.jogadorAtualId);
        const logEntry = result.atacanteVenceu
          ? `${attacker?.name} conquistou ${toT.name}!`
          : `Ataque de ${attacker?.name} em ${toT.name} foi repelido.`;

        const next = {
          ...game,
          territories,
          turno: { ...game.turno, atacouNesteturno: true },
          log: [...game.log, logEntry],
        };
        const victoryCheck = checkVictory(next);
        set({
          game: victoryCheck.hasWinner
            ? { ...next, vencedor: victoryCheck.winnerId, log: [...next.log, victoryCheck.reason ?? ""] }
            : next,
        });
      },

      moveArmies: (fromId, toId, count) => {
        const { game } = get();
        if (!game) return;

        const fromT = game.territories.find((t) => t.id === fromId);
        const toT = game.territories.find((t) => t.id === toId);
        if (!fromT || !toT) return;

        const { valid, reason } = canMove(fromT, toT, game.turno.jogadorAtualId, count);
        if (!valid) {
          set({ game: { ...game, log: [...game.log, `Movimento inválido: ${reason}`] } });
          return;
        }

        const territories = game.territories.map((t) => {
          if (t.id === fromId) return { ...t, tropasAtuais: t.tropasAtuais - count };
          if (t.id === toId) return { ...t, tropasAtuais: t.tropasAtuais + count };
          return t;
        });

        set({
          game: {
            ...game,
            territories,
            turno: {
              ...game.turno,
              territoriosMovidosNesteturno: [...game.turno.territoriosMovidosNesteturno, fromId],
            },
          },
        });
      },

      endTurn: () => {
        const { game } = get();
        if (!game) return;
        // Decay faith toward base for all territories before ending turn
        const territories = game.territories.map(decayFaithTowardBase);
        const next = advancePhase({ ...game, territories, turno: { ...game.turno, fase: "fim_turno" } });
        set({ game: next });
      },

      saveGame: () => {
        set((state) => ({
          game: state.game ? { ...state.game, savedAt: new Date().toISOString() } : null,
        }));
      },

      hasSavedGame: () => get().game !== null,
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      partialize: (state) => ({ game: state.game }),
      migrate: (_persistedState, version) => {
        // Any state from before version 2 is incompatible — discard it
        if (version < 2) return { game: null };
        return _persistedState as { game: GameState | null };
      },
    }
  )
);
