
import { useState } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { GAME_MODES, TROOP_LIMITS } from "@/types";
import { getFaithInfo } from "@/game-core/faith";
import GameMap from "@/components/GameMap";
import TerritoryDetail from "@/components/TerritoryDetail";

const PHASE_LABELS: Record<string, string> = {
  producao: "Produção",
  cartas: "Cartas",
  movimento: "Movimento",
  combate: "Combate",
  fim_turno: "Fim do Turno",
};

const PHASE_ORDER = ["producao", "cartas", "movimento", "combate", "fim_turno"];

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { game, nextPhase, finishTurn, saveGame, resetGame } = useGameStore();
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);

  if (!game) {
    setLocation("/");
    return null;
  }

  const currentPlayer = game.players.find((p) => p.id === game.turno.jogadorAtualId);
  const legadoMax = GAME_MODES[game.mode].legadoMaximo;
  const selectedTerritory = selectedTerritoryId
    ? game.territories.find((t) => t.id === selectedTerritoryId) ?? null
    : null;

  const phaseIndex = PHASE_ORDER.indexOf(game.turno.fase);

  // ── Victory ──────────────────────────────────────────────────────────────
  if (game.vencedor) {
    const winner = game.players.find((p) => p.id === game.vencedor);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-center px-4">
        <div className="text-7xl mb-6">👑</div>
        <h1 className="text-4xl font-bold text-amber-100" style={{ fontFamily: "Georgia, serif" }}>
          Vitória!
        </h1>
        <p className="text-amber-300 text-2xl mt-2 font-semibold">{winner?.name}</p>
        <p className="text-amber-500/60 mt-3 text-sm">{game.log[game.log.length - 1]}</p>
        <button
          onClick={() => { resetGame(); setLocation("/"); }}
          className="mt-8 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all"
        >
          Novo Jogo
        </button>
      </div>
    );
  }

  function handleQuit() {
    if (confirm("Sair? A partida será salva.")) {
      saveGame();
      setLocation("/");
    }
  }

  return (
    <div className="h-screen flex flex-col bg-stone-950 text-amber-100 overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-amber-950/80 border-b border-amber-800/30 backdrop-blur-sm gap-2">
        {/* Left: round + current player */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-amber-500 text-xs font-semibold whitespace-nowrap">
            Rodada {game.turno.rodada}
          </span>
          <span className="text-amber-800">·</span>
          <div
            className="text-xs font-bold px-2 py-0.5 rounded truncate max-w-[110px]"
            style={{
              backgroundColor: (currentPlayer?.color ?? "#666") + "2a",
              color: currentPlayer?.color ?? "#aaa",
            }}
          >
            {currentPlayer?.name}
          </div>
        </div>

        {/* Center: phase bar */}
        <div className="hidden sm:flex items-center gap-1">
          {PHASE_ORDER.map((phase, i) => (
            <div key={phase} className="flex items-center gap-1">
              <div
                className={`text-xs px-2 py-0.5 rounded transition-all ${
                  i === phaseIndex
                    ? "bg-amber-700/60 text-amber-200 font-semibold"
                    : i < phaseIndex
                    ? "text-amber-700/40"
                    : "text-amber-700/30"
                }`}
              >
                {PHASE_LABELS[phase]}
              </div>
              {i < PHASE_ORDER.length - 1 && (
                <span className="text-amber-800/30 text-xs">›</span>
              )}
            </div>
          ))}
        </div>

        {/* Right: actions + buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Action pips */}
          <div className="flex gap-1 items-center">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < game.turno.acoesRestantes ? "bg-amber-400" : "bg-amber-900"
                }`}
              />
            ))}
          </div>
          <button
            onClick={saveGame}
            className="text-amber-600 hover:text-amber-400 text-xs px-2 py-1 rounded border border-amber-800/30 hover:border-amber-600/40 transition-all"
          >
            Salvar
          </button>
          <button
            onClick={handleQuit}
            className="text-amber-700 hover:text-amber-500 text-xs transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 relative">
          <GameMap
            territories={game.territories}
            players={game.players}
            selectedId={selectedTerritoryId}
            currentPlayerId={game.turno.jogadorAtualId}
            onSelect={(id) =>
              setSelectedTerritoryId((prev) => (prev === id ? null : id))
            }
          />

          {/* Mobile phase label */}
          <div className="sm:hidden absolute top-2 left-2 bg-stone-950/80 rounded-lg px-2 py-1 text-amber-400 text-xs font-semibold">
            {PHASE_LABELS[game.turno.fase]}
          </div>

          {/* Click hint */}
          {!selectedTerritoryId && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-amber-800/60 text-xs pointer-events-none">
              Clique em um território para ver detalhes
            </div>
          )}
        </main>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-stone-950 border-l border-amber-900/30 overflow-y-auto">
          {/* Territory detail OR player overview */}
          {selectedTerritory ? (
            <div className="flex-1">
              <div className="flex items-center justify-between px-4 pt-3 pb-0">
                <span className="text-amber-500 text-xs uppercase tracking-widest">Território</span>
                <button
                  onClick={() => setSelectedTerritoryId(null)}
                  className="text-amber-800 hover:text-amber-500 text-xs transition-colors"
                >
                  ✕ fechar
                </button>
              </div>
              <TerritoryDetail
                territory={selectedTerritory}
                players={game.players}
                currentPlayerId={game.turno.jogadorAtualId}
              />
            </div>
          ) : (
            <div className="flex-1 p-3 flex flex-col gap-3">
              {/* Players summary */}
              <div>
                <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-2">Facções</h3>
                <div className="flex flex-col gap-1.5">
                  {game.players.map((p) => {
                    const controlled = game.territories.filter(
                      (t) => t.donoAtual === p.id
                    ).length;
                    const isActive = p.id === game.turno.jogadorAtualId;
                    const legadoPct = Math.min(1, p.resources.legado / legadoMax);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-lg px-2.5 py-2 transition-all ${
                          isActive
                            ? "bg-amber-900/40 ring-1 ring-amber-700/40"
                            : "bg-stone-900/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: p.color }}
                            />
                            <span className="text-amber-200 text-xs font-medium truncate">
                              {p.name}
                            </span>
                            {p.isBot && (
                              <span className="text-amber-800 text-xs flex-shrink-0">bot</span>
                            )}
                          </div>
                          <span className="text-amber-600 text-xs flex-shrink-0">
                            {controlled} terr.
                          </span>
                        </div>
                        {/* Legado bar */}
                        <div className="h-1 rounded-full bg-stone-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${legadoPct * 100}%`,
                              backgroundColor: p.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-amber-800 text-xs">Legado</span>
                          <span className="text-amber-600 text-xs">
                            {p.resources.legado}/{legadoMax}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Territory counts by faith */}
              <div>
                <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-2">Mapa</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    { label: "Neutros", count: game.territories.filter((t) => !t.donoAtual && !t.bloqueado).length, color: "#78716c" },
                    { label: "Bloqueados", count: game.territories.filter((t) => t.bloqueado).length, color: "#44403c" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-stone-900/40 rounded-lg p-2 text-center">
                      <div className="font-bold text-base" style={{ color: stat.color }}>
                        {stat.count}
                      </div>
                      <div className="text-amber-800">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Current player resources ───────────────────────────────────── */}
          {currentPlayer && (
            <div className="flex-shrink-0 border-t border-amber-900/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-amber-500 text-xs uppercase tracking-widest">Recursos</h3>
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    color: currentPlayer.color,
                    backgroundColor: currentPlayer.color + "22",
                  }}
                >
                  {currentPlayer.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: "provisao", label: "Provisão", icon: "🌾", max: 12, color: "#4ade80" },
                  { key: "ouro", label: "Ouro", icon: "🪙", max: 10, color: "#fbbf24" },
                  { key: "influencia", label: "Influência", icon: "👁", max: 8, color: "#60a5fa" },
                  { key: "legado", label: "Legado", icon: "⭐", max: legadoMax, color: "#c084fc" },
                ].map((r) => {
                  const val = currentPlayer.resources[r.key as keyof typeof currentPlayer.resources];
                  return (
                    <div key={r.key} className="bg-stone-900/50 rounded-lg px-2 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{r.icon}</span>
                        <span className="text-xs font-bold" style={{ color: r.color }}>
                          {val}
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(1, val / r.max) * 100}%`,
                            backgroundColor: r.color,
                          }}
                        />
                      </div>
                      <div className="text-amber-800 text-xs mt-0.5">{r.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Turn controls ──────────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-amber-900/30 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-amber-500 text-xs uppercase tracking-widest">
                {PHASE_LABELS[game.turno.fase]}
              </span>
              <span className="text-amber-700 text-xs">
                {game.turno.acoesRestantes} ações
              </span>
            </div>

            {game.turno.fase !== "fim_turno" && (
              <button
                onClick={() => nextPhase()}
                className="w-full py-2 text-sm font-semibold text-amber-200 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/30 rounded-lg transition-all"
              >
                Próxima fase →
              </button>
            )}
            <button
              onClick={() => finishTurn()}
              className="w-full py-2.5 text-sm font-bold text-white bg-amber-700 hover:bg-amber-600 active:bg-amber-800 rounded-lg transition-all shadow-md shadow-amber-900/30"
            >
              Passar turno
            </button>
          </div>

          {/* ── Action log ─────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-amber-900/30 p-3 max-h-40 overflow-hidden">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-2">Histórico</h3>
            <div className="flex flex-col-reverse gap-0.5 overflow-y-auto max-h-28">
              {[...game.log].reverse().slice(0, 20).map((entry, i) => (
                <p
                  key={i}
                  className={`text-xs leading-relaxed ${
                    entry.startsWith("──")
                      ? "text-amber-600/80 font-semibold mt-1"
                      : "text-amber-700/70"
                  }`}
                >
                  {entry}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
