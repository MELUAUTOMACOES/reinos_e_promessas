
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { getFaithInfo } from "@/game-core/faith";
import { GAME_MODES, TROOP_LIMITS } from "@/types";

const PHASE_LABELS: Record<string, string> = {
  producao: "Produção",
  cartas: "Cartas",
  movimento: "Movimento",
  combate: "Combate",
  fim_turno: "Fim do Turno",
};

const PHASE_HINT: Record<string, string> = {
  producao: "Recursos coletados automaticamente ao início do turno.",
  cartas: "Jogue ou descarte cartas da sua mão.",
  movimento: "Mova tropas entre territórios adjacentes seus.",
  combate: "Ataque territórios inimigos adjacentes.",
  fim_turno: "Confirme para passar a vez.",
};

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { game, nextPhase, finishTurn, saveGame, resetGame } = useGameStore();

  if (!game) {
    setLocation("/");
    return null;
  }

  const currentPlayer = game.players.find((p) => p.id === game.turno.jogadorAtualId);

  // ── Victory screen ─────────────────────────────────────────────────────────
  if (game.vencedor) {
    const winner = game.players.find((p) => p.id === game.vencedor);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-950 text-center px-4">
        <div className="text-6xl mb-4">👑</div>
        <h1
          className="text-4xl font-bold text-amber-100"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Vitória!
        </h1>
        <p className="text-amber-300 text-2xl mt-2">{winner?.name}</p>
        <p className="text-amber-200/60 mt-4 max-w-sm leading-relaxed">
          {game.log[game.log.length - 1]}
        </p>
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
    if (confirm("Sair da partida? O progresso será salvo.")) {
      saveGame();
      setLocation("/");
    }
  }

  const legadoMax = GAME_MODES[game.mode].legadoMaximo;

  return (
    <div className="min-h-screen bg-stone-950 text-amber-100 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-amber-950/80 border-b border-amber-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-amber-400 text-sm font-semibold">
            Rodada {game.turno.rodada}
          </span>
          <span className="text-amber-700">·</span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded"
            style={{
              backgroundColor: (currentPlayer?.color ?? "#666") + "33",
              color: currentPlayer?.color ?? "#aaa",
            }}
          >
            {currentPlayer?.name}
          </span>
          <span className="text-amber-500 text-sm">{PHASE_LABELS[game.turno.fase]}</span>
          {/* Actions remaining pips */}
          <div className="flex gap-1 items-center ml-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < game.turno.acoesRestantes ? "bg-amber-400" : "bg-amber-800/50"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveGame}
            className="text-amber-500 text-xs px-3 py-1.5 border border-amber-700/40 rounded-lg hover:bg-amber-900/30 transition-all"
          >
            Salvar
          </button>
          <button
            onClick={handleQuit}
            className="text-amber-600 text-xs px-3 py-1.5 hover:text-amber-400 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Map area ─────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col gap-4 items-center justify-center bg-stone-900/50 p-4 overflow-y-auto">
          <div className="text-center text-amber-700/50">
            <div className="text-5xl mb-2">🗺️</div>
            <p className="text-xs">Mapa interativo em desenvolvimento</p>
          </div>

          {/* Territory cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-2xl">
            {game.territories
              .filter((t) => t.donoAtual !== null)
              .map((t) => {
                const owner = game.players.find((p) => p.id === t.donoAtual);
                const faithInfo = getFaithInfo(t.feAtual);
                const troopMax = TROOP_LIMITS[t.type];
                const fill = Math.min(1, t.tropasAtuais / troopMax);
                return (
                  <div
                    key={t.id}
                    className="rounded-lg border p-2.5 text-xs flex flex-col gap-1.5"
                    style={{
                      backgroundColor: (owner?.color ?? "#666") + "18",
                      borderColor: (owner?.color ?? "#666") + "44",
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-amber-200 truncate">{t.name}</span>
                      <span
                        className="text-xs px-1 rounded"
                        style={{ color: faithInfo.color, backgroundColor: faithInfo.color + "22" }}
                      >
                        {faithInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">⚔ {t.tropasAtuais}/{troopMax}</span>
                      <span className="text-amber-700">Fé {t.feAtual}</span>
                    </div>
                    {/* Troop fill bar */}
                    <div className="h-1 rounded-full bg-amber-900/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${fill * 100}%`,
                          backgroundColor: owner?.color ?? "#666",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </main>

        {/* ── Side panel ───────────────────────────────────────────────────── */}
        <aside className="w-72 flex flex-col bg-amber-950/40 border-l border-amber-800/30 overflow-y-auto flex-shrink-0">
          {/* Players */}
          <div className="p-4 border-b border-amber-800/20">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">Facções</h3>
            <div className="flex flex-col gap-2">
              {game.players.map((p) => {
                const controlled = game.territories.filter((t) => t.donoAtual === p.id).length;
                const isActive = p.id === game.turno.jogadorAtualId;
                const legadoPct = Math.min(1, p.resources.legado / legadoMax);
                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg transition-all ${
                      isActive ? "bg-amber-900/50 ring-1 ring-amber-600/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-sm font-medium text-amber-200">{p.name}</span>
                        {p.isBot && <span className="text-amber-700 text-xs">bot</span>}
                      </div>
                      <span className="text-amber-500 text-xs">{controlled}🏛</span>
                    </div>
                    {/* Legado progress bar */}
                    <div className="mt-1.5 h-1 rounded-full bg-amber-900/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${legadoPct * 100}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-amber-700 text-xs">Legado</span>
                      <span className="text-amber-500 text-xs">
                        {p.resources.legado}/{legadoMax}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current player resources */}
          {currentPlayer && (
            <div className="p-4 border-b border-amber-800/20">
              <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">
                Recursos
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Provisão", value: currentPlayer.resources.provisao, max: 12, color: "text-green-400" },
                  { label: "Ouro", value: currentPlayer.resources.ouro, max: 10, color: "text-yellow-400" },
                  { label: "Influência", value: currentPlayer.resources.influencia, max: 8, color: "text-blue-400" },
                  { label: "Legado", value: currentPlayer.resources.legado, max: legadoMax, color: "text-purple-400" },
                ].map((r) => (
                  <div key={r.label} className="bg-amber-900/20 rounded-lg p-2 text-center">
                    <div className={`font-bold text-lg ${r.color}`}>{r.value}</div>
                    <div className="text-amber-700 text-xs">{r.label}</div>
                    <div className="mt-1 h-1 rounded-full bg-amber-900/40 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(1, r.value / r.max) * 100}%`,
                          backgroundColor: r.color.replace("text-", "").replace("-400", ""),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase control */}
          <div className="p-4 border-b border-amber-800/20">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-1">
              {PHASE_LABELS[game.turno.fase]}
            </h3>
            <p className="text-amber-700/70 text-xs mb-3">{PHASE_HINT[game.turno.fase]}</p>
            <div className="flex flex-col gap-2">
              {game.turno.fase !== "fim_turno" ? (
                <button
                  onClick={() => nextPhase()}
                  className="w-full py-2 bg-amber-700/50 hover:bg-amber-700 text-amber-100 text-sm font-semibold rounded-lg transition-all border border-amber-600/30"
                >
                  Próxima Fase →
                </button>
              ) : null}
              <button
                onClick={() => finishTurn()}
                className="w-full py-2 bg-amber-900/60 hover:bg-amber-900 text-amber-300 text-sm rounded-lg transition-all border border-amber-800/30"
              >
                Encerrar Turno
              </button>
            </div>
          </div>

          {/* Game log */}
          <div className="p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">Histórico</h3>
            <div className="flex flex-col-reverse gap-1 overflow-y-auto flex-1">
              {[...game.log].reverse().slice(0, 30).map((entry, i) => (
                <p key={i} className="text-amber-400/60 text-xs leading-relaxed">
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
