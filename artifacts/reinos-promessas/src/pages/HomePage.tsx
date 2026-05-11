
import { useState } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import type { GameMode, NewGameConfig, BotDifficulty } from "@/types";
import { GAME_MODES } from "@/types";
import { FACTIONS } from "@/game-data/factions";
import { STARTING_PACKS } from "@/game-data/startingPacks";

// ── Setup step management ─────────────────────────────────────────────────────

type SetupStep = "idle" | "count" | "packs" | "confirm";

interface PlayerSetup {
  factionIdx: number;
  packId: string;
  isBot: boolean;
}

function buildConfig(
  mode: GameMode,
  playerCount: number,
  setups: PlayerSetup[],
  shuffledFactions: typeof FACTIONS
): NewGameConfig {
  return {
    mode,
    players: setups.slice(0, playerCount).map((s, i) => {
      const faction = shuffledFactions[s.factionIdx % shuffledFactions.length];
      return {
        name: s.isBot ? `Bot — ${faction.name}` : faction.name,
        factionId: faction.id,
        packId: s.packId,
        isBot: s.isBot,
        botDifficulty: s.isBot ? ("medio" as BotDifficulty) : undefined,
      };
    }),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { startGame, hasSavedGame, resetGame, game } = useGameStore();

  const [step, setStep] = useState<SetupStep>("idle");
  const [playerCount, setPlayerCount] = useState(2);
  const [mode, setMode] = useState<GameMode>("padrao");
  const [humanPackId, setHumanPackId] = useState(STARTING_PACKS[0].id);

  // Shuffle factions once per component lifecycle
  const [shuffledFactions] = useState(() => {
    const arr = [...FACTIONS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  function handleStartGame() {
    // Human is player 0, bots fill the rest with different packs
    const usedPacks = new Set<string>([humanPackId]);
    const botPacks = STARTING_PACKS.filter((p) => !usedPacks.has(p.id));

    const setups: PlayerSetup[] = Array.from({ length: playerCount }, (_, i) => {
      if (i === 0) {
        return { factionIdx: 0, packId: humanPackId, isBot: false };
      }
      const pack = botPacks[(i - 1) % botPacks.length];
      usedPacks.add(pack.id);
      return { factionIdx: i, packId: pack.id, isBot: true };
    });

    const config = buildConfig(mode, playerCount, setups, shuffledFactions);
    startGame(config);
    setLocation("/game");
  }

  function handleReset() {
    if (confirm("Apagar partida salva? Esta ação não pode ser desfeita.")) {
      resetGame();
      setStep("idle");
    }
  }

  const humanFaction = shuffledFactions[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center max-w-lg w-full">
        {/* Logo */}
        <div className="text-amber-400 text-5xl select-none">✦</div>
        <div>
          <h1
            className="text-5xl font-bold text-amber-100 tracking-wide drop-shadow-lg"
            style={{ fontFamily: "Georgia, serif", textShadow: "0 2px 20px rgba(217,119,6,0.6)" }}
          >
            Reinos &amp; Promessas
          </h1>
          <p className="mt-3 text-amber-300 tracking-widest uppercase text-sm">
            Estratégia Bíblica
          </p>
        </div>

        <p className="text-amber-200/70 text-sm max-w-xs leading-relaxed">
          Conquiste as terras do Antigo Testamento, cumpra as promessas divinas e erga seu reino sobre a areia dos séculos.
        </p>

        {/* ── IDLE ──────────────────────────────────────────────────────────── */}
        {step === "idle" && (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setStep("count")}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-900/50 active:scale-95 border border-amber-500/30"
            >
              Nova Partida
            </button>
            {hasSavedGame() && game && (
              <button
                onClick={() => setLocation("/game")}
                className="w-full py-3 bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 font-semibold rounded-xl transition-all border border-amber-700/40 backdrop-blur-sm active:scale-95"
              >
                Continuar Partida
                <span className="block text-amber-400/60 text-xs font-normal mt-0.5">
                  Rodada {game.turno.rodada} · {game.players.find((p) => !p.isBot)?.faction} ·{" "}
                  {GAME_MODES[game.mode].label}
                </span>
              </button>
            )}
            {hasSavedGame() && (
              <button
                onClick={handleReset}
                className="text-amber-700/70 text-sm hover:text-amber-500 transition-colors mt-1"
              >
                Apagar partida salva
              </button>
            )}
          </div>
        )}

        {/* ── COUNT + MODE ──────────────────────────────────────────────────── */}
        {step === "count" && (
          <div className="w-full bg-amber-950/60 border border-amber-700/40 rounded-xl p-6 flex flex-col gap-5 backdrop-blur-sm">
            <h2 className="text-amber-200 font-semibold text-lg text-left">Configurar Partida</h2>

            {/* Player count */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-amber-400 text-xs uppercase tracking-widest">Jogadores</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${
                      playerCount === n
                        ? "bg-amber-600 border-amber-500 text-white"
                        : "bg-amber-950/40 border-amber-700/30 text-amber-300 hover:bg-amber-800/30"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-amber-600/70 text-xs">
                {playerCount === 2
                  ? "Você vs 1 bot"
                  : `Você vs ${playerCount - 1} bots`}
              </p>
            </div>

            {/* Game mode */}
            <div className="flex flex-col gap-2 text-left">
              <label className="text-amber-400 text-xs uppercase tracking-widest">Modo</label>
              <div className="flex gap-2">
                {(Object.values(GAME_MODES) as (typeof GAME_MODES)[keyof typeof GAME_MODES][]).map(
                  (m) => (
                    <button
                      key={m.mode}
                      onClick={() => setMode(m.mode)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${
                        mode === m.mode
                          ? "bg-amber-600 border-amber-500 text-white"
                          : "bg-amber-950/40 border-amber-700/30 text-amber-300 hover:bg-amber-800/30"
                      }`}
                    >
                      {m.label}
                    </button>
                  )
                )}
              </div>
              <p className="text-amber-600/70 text-xs">
                {mode === "rapido"
                  ? "Vitória com 100 pontos de Legado"
                  : "Vitória com 150 pontos de Legado"}
              </p>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setStep("idle")}
                className="flex-1 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep("packs")}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── PACK SELECTION ────────────────────────────────────────────────── */}
        {step === "packs" && (
          <div className="w-full bg-amber-950/60 border border-amber-700/40 rounded-xl p-6 flex flex-col gap-4 backdrop-blur-sm">
            <div className="text-left">
              <h2 className="text-amber-200 font-semibold text-lg">Escolha seu Pacote Inicial</h2>
              <p className="text-amber-500/80 text-xs mt-1">
                Sua facção:{" "}
                <span className="font-semibold" style={{ color: humanFaction.color }}>
                  {humanFaction.name}
                </span>{" "}
                · {humanFaction.description}
              </p>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {STARTING_PACKS.map((pack) => {
                const isSelected = humanPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setHumanPackId(pack.id)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-amber-700/40 border-amber-500 ring-1 ring-amber-500/50"
                        : "bg-amber-950/40 border-amber-800/30 hover:bg-amber-900/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-amber-200 text-sm font-semibold">
                        {pack.label}
                      </span>
                      {isSelected && (
                        <span className="text-amber-400 text-xs">✓ Selecionado</span>
                      )}
                    </div>
                    <p className="text-amber-500/80 text-xs mt-1 leading-relaxed">
                      {pack.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setStep("count")}
                className="flex-1 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleStartGame}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all active:scale-95"
              >
                Iniciar Partida
              </button>
            </div>
          </div>
        )}

        <p className="text-amber-800 text-xs mt-2">
          MVP · Sem backend · 24 territórios · Partida salva localmente
        </p>
      </div>
    </div>
  );
}
