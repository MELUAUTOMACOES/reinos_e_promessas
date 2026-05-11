
import { useState } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import type { GameMode, NewGameConfig, BotDifficulty } from "@/types";
import { GAME_MODES } from "@/types";
import { FACTIONS } from "@/game-data/factions";
import { STARTING_PACKS } from "@/game-data/startingPacks";

// ─── Types ────────────────────────────────────────────────────────────────────

type SetupStep = "landing" | "config";

interface PlayerConfig {
  name: string;
  isBot: boolean;
  botDifficulty: BotDifficulty;
  factionIdx: number;
}

const PLAYER_COLORS = [
  "#1d4ed8", "#7c3aed", "#dc2626", "#b45309", "#059669", "#0891b2",
];

const DEFAULT_BOT_NAMES = [
  "Bot Absalão", "Bot Golias", "Bot Jezabel",
  "Bot Senaque", "Bot Nabucodonosor",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { startGame, hasSavedGame, resetGame, game } = useGameStore();

  const [step, setStep] = useState<SetupStep>("landing");
  const [playerCount, setPlayerCount] = useState(3);
  const [mode, setMode] = useState<GameMode>("padrao");

  const [players, setPlayers] = useState<PlayerConfig[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      name: i === 0 ? "" : DEFAULT_BOT_NAMES[i - 1] ?? `Bot ${i}`,
      isBot: i !== 0,
      botDifficulty: "medio" as BotDifficulty,
      factionIdx: i,
    }))
  );

  function updatePlayer(index: number, patch: Partial<PlayerConfig>) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function handleStartGame() {
    // Assign packs automatically, rotating through available packs
    const usedPacks = new Set<string>();
    const packList = [...STARTING_PACKS];

    const config: NewGameConfig = {
      mode,
      players: players.slice(0, playerCount).map((p, i) => {
        const faction = FACTIONS[p.factionIdx % FACTIONS.length];
        // Pick first available pack
        const pack = packList.find((pk) => !usedPacks.has(pk.id)) ?? packList[i % packList.length];
        usedPacks.add(pack.id);
        return {
          name: p.name.trim() || (i === 0 ? faction.name : DEFAULT_BOT_NAMES[i - 1] ?? `Bot ${i}`),
          factionId: faction.id,
          packId: pack.id,
          isBot: p.isBot,
          botDifficulty: p.isBot ? p.botDifficulty : undefined,
        };
      }),
    };

    startGame(config);
    setLocation("/game");
  }

  function handleReset() {
    if (confirm("Apagar partida salva? Esta ação não pode ser desfeita.")) {
      resetGame();
    }
  }

  // ── Landing ──────────────────────────────────────────────────────────────

  if (step === "landing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 relative overflow-hidden px-4">
        {/* Subtle cross-hatch pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d97706' fill-opacity='1'%3E%3Cpath d='M0 20h40v1H0zM20 0v40h1V0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-7 max-w-sm w-full text-center">
          <div className="text-amber-400 text-4xl select-none leading-none">✦</div>

          <div>
            <h1
              className="text-5xl font-bold text-amber-100 tracking-wide"
              style={{
                fontFamily: "Georgia, serif",
                textShadow: "0 2px 30px rgba(217,119,6,0.5)",
              }}
            >
              Reinos &amp;<br />Promessas
            </h1>
            <p className="mt-3 text-amber-400/80 tracking-[0.3em] uppercase text-xs font-medium">
              Estratégia Bíblica
            </p>
          </div>

          <p className="text-amber-200/60 text-sm leading-relaxed max-w-xs">
            Conquiste as terras do Antigo Testamento. Controle territórios, gerencie fé e recursos, e erga seu legado sobre as nações.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setStep("config")}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-base rounded-xl transition-all shadow-xl shadow-amber-900/40 border border-amber-500/30"
            >
              Nova Partida
            </button>

            {hasSavedGame() && game && (
              <button
                onClick={() => setLocation("/game")}
                className="w-full py-3 bg-stone-900/70 hover:bg-stone-800/70 text-amber-200 font-semibold rounded-xl transition-all border border-amber-700/30 backdrop-blur-sm"
              >
                Continuar Partida
                <span className="block text-amber-500/60 text-xs font-normal mt-0.5">
                  Rodada {game.turno.rodada} · {GAME_MODES[game.mode].label} ·{" "}
                  {game.players.find((p) => p.id === game.turno.jogadorAtualId)?.name}
                </span>
              </button>
            )}
          </div>

          {hasSavedGame() && (
            <button
              onClick={handleReset}
              className="text-amber-800 hover:text-amber-600 text-xs transition-colors mt-1"
            >
              Apagar partida salva
            </button>
          )}

          <p className="text-amber-900 text-xs mt-2">
            MVP local · 24 territórios · Sem backend
          </p>
        </div>
      </div>
    );
  }

  // ── Config ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-start py-8 px-4 overflow-y-auto">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStep("landing")}
            className="text-amber-600 hover:text-amber-400 transition-colors text-sm"
          >
            ← Voltar
          </button>
          <h1
            className="text-xl font-bold text-amber-100"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Configurar Partida
          </h1>
        </div>

        <div className="flex flex-col gap-5">
          {/* Game mode */}
          <section className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-4">
            <h2 className="text-amber-400 text-xs uppercase tracking-widest mb-3">Modo de Jogo</h2>
            <div className="flex gap-2">
              {(Object.values(GAME_MODES) as (typeof GAME_MODES)[keyof typeof GAME_MODES][]).map(
                (m) => (
                  <button
                    key={m.mode}
                    onClick={() => setMode(m.mode)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                      mode === m.mode
                        ? "bg-amber-700/60 border-amber-500/60 text-amber-100"
                        : "bg-transparent border-amber-800/30 text-amber-500 hover:bg-amber-900/30"
                    }`}
                  >
                    {m.label}
                    <span className="block text-xs font-normal opacity-70 mt-0.5">
                      {m.legadoMaximo} Legado
                    </span>
                  </button>
                )
              )}
            </div>
          </section>

          {/* Player count */}
          <section className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-4">
            <h2 className="text-amber-400 text-xs uppercase tracking-widest mb-3">
              Número de Jogadores
            </h2>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setPlayerCount(n)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border ${
                    playerCount === n
                      ? "bg-amber-700/60 border-amber-500/60 text-amber-100"
                      : "bg-transparent border-amber-800/30 text-amber-500 hover:bg-amber-900/30"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Players */}
          <section className="bg-amber-950/40 border border-amber-800/30 rounded-xl p-4">
            <h2 className="text-amber-400 text-xs uppercase tracking-widest mb-3">Jogadores</h2>
            <div className="flex flex-col gap-3">
              {players.slice(0, playerCount).map((p, i) => {
                const faction = FACTIONS[p.factionIdx % FACTIONS.length];
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-amber-800/20 p-3 bg-amber-900/10"
                  >
                    {/* Row 1: color dot + name input + faction */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PLAYER_COLORS[i] }}
                      />
                      <input
                        type="text"
                        value={p.name}
                        placeholder={i === 0 ? "Seu nome" : faction.name}
                        onChange={(e) => updatePlayer(i, { name: e.target.value })}
                        className="flex-1 bg-transparent text-amber-100 text-sm placeholder-amber-700 outline-none border-b border-amber-800/40 focus:border-amber-600/60 pb-0.5 transition-colors"
                        readOnly={p.isBot}
                      />
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          color: faction.color,
                          backgroundColor: faction.color + "22",
                        }}
                      >
                        {faction.name}
                      </span>
                    </div>

                    {/* Row 2: human/bot + difficulty */}
                    {i === 0 ? (
                      <div className="text-amber-600/60 text-xs pl-5">Jogador humano</div>
                    ) : (
                      <div className="flex items-center gap-2 pl-5 flex-wrap">
                        <div className="flex rounded-lg overflow-hidden border border-amber-800/30 text-xs">
                          <button
                            onClick={() => updatePlayer(i, { isBot: false, name: "" })}
                            className={`px-2.5 py-1 transition-colors ${
                              !p.isBot
                                ? "bg-amber-700/50 text-amber-100"
                                : "bg-transparent text-amber-600 hover:bg-amber-900/30"
                            }`}
                          >
                            Humano
                          </button>
                          <button
                            onClick={() =>
                              updatePlayer(i, {
                                isBot: true,
                                name: DEFAULT_BOT_NAMES[i - 1] ?? `Bot ${i}`,
                              })
                            }
                            className={`px-2.5 py-1 transition-colors ${
                              p.isBot
                                ? "bg-amber-700/50 text-amber-100"
                                : "bg-transparent text-amber-600 hover:bg-amber-900/30"
                            }`}
                          >
                            Bot
                          </button>
                        </div>
                        {p.isBot && (
                          <div className="flex rounded-lg overflow-hidden border border-amber-800/30 text-xs">
                            {(["facil", "medio", "dificil"] as BotDifficulty[]).map((d) => (
                              <button
                                key={d}
                                onClick={() => updatePlayer(i, { botDifficulty: d })}
                                className={`px-2.5 py-1 transition-colors capitalize ${
                                  p.botDifficulty === d
                                    ? "bg-amber-800/60 text-amber-200"
                                    : "bg-transparent text-amber-700 hover:bg-amber-900/30"
                                }`}
                              >
                                {d === "facil" ? "Fácil" : d === "medio" ? "Médio" : "Difícil"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Info about packs */}
          <p className="text-amber-700/60 text-xs text-center">
            Pacotes iniciais serão atribuídos automaticamente.
          </p>

          {/* Start */}
          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-lg rounded-xl transition-all shadow-xl shadow-amber-900/40 border border-amber-500/30"
          >
            Iniciar Partida
          </button>
        </div>
      </div>
    </div>
  );
}
