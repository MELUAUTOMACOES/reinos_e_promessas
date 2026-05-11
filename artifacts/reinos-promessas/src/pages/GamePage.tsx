
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { GAME_MODES, TROOP_LIMITS } from "@/types";
import { getFaithInfo } from "@/game-core/faith";
import { findReachable } from "@/game-core/movement";
import GameMap from "@/components/GameMap";
import TerritoryDetail from "@/components/TerritoryDetail";

// ─── Quiz data ────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: "Quem construiu o primeiro Templo em Jerusalém?",
    options: ["Davi", "Salomão", "Josué", "Moisés"],
    correct: 1,
  },
  {
    question: "Qual profeta foi engolido por um grande peixe?",
    options: ["Elias", "Ezequiel", "Isaías", "Jonas"],
    correct: 3,
  },
  {
    question: "Qual foi o primeiro rei de Israel?",
    options: ["Davi", "Samuel", "Saul", "Gedeão"],
    correct: 2,
  },
  {
    question: "Em que monte Moisés recebeu as Tábuas da Lei?",
    options: ["Monte Carmelo", "Monte Sinai", "Monte Nebo", "Monte Sião"],
    correct: 1,
  },
  {
    question: "Qual rei babilônico destruiu Jerusalém e o Templo?",
    options: ["Nabonido", "Cambises", "Ciro", "Nabucodonosor"],
    correct: 3,
  },
  {
    question: "Quem vendeu José como escravo no Egito?",
    options: ["Seus irmãos", "Seu pai Jacó", "Os madianitas", "Faraó"],
    correct: 0,
  },
  {
    question: "Qual juiz de Israel tinha força no cabelo?",
    options: ["Gedeão", "Débora", "Sansão", "Jefté"],
    correct: 2,
  },
];

// ─── Action mode type ─────────────────────────────────────────────────────────

type ActionMode =
  | { type: "idle" }
  | { type: "move_target"; fromId: string }
  | { type: "move_confirm"; fromId: string; toId: string; count: number; maxCount: number }
  | { type: "faith"; territoryId: string }
  | { type: "quiz"; territoryId: string; questionIdx: number }
  | { type: "quiz_result"; territoryId: string; correct: boolean; delta: number }
  | { type: "discard" };

// ─── Phase labels ─────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  producao: "Produção",
  cartas: "Cartas",
  movimento: "Movimento",
  combate: "Combate",
  fim_turno: "Fim do Turno",
};

const PHASE_ORDER = ["producao", "cartas", "movimento", "combate", "fim_turno"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamePage() {
  const [, setLocation] = useLocation();
  const {
    game,
    nextPhase,
    finishTurn,
    saveGame,
    resetGame,
    recruitTroopsAction,
    moveTroopsAction,
    strengthenFaithAction,
    discardCardAction,
    executeBotAction,
  } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>({ type: "idle" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!game) { setLocation("/"); return null; }

  // Auto-executar ações do bot
  useEffect(() => {
    if (!game || game.vencedor) return;
    const cp = game.players.find(p => p.id === game.turno.jogadorAtualId);
    if (!cp || !cp.isBot) return;
    if (game.turno.acoesRestantes <= 0) return;

    const timer = setTimeout(() => {
      executeBotAction();
    }, 600);

    return () => clearTimeout(timer);
  }, [game?.turno.jogadorAtualId, game?.turno.acoesRestantes, game?.vencedor]);

  // Non-null reference for closures (TS doesn't narrow across function boundaries)
  const g = game;

  const currentPlayer = g.players.find((p) => p.id === g.turno.jogadorAtualId);
  const legadoMax = GAME_MODES[game.mode].legadoMaximo;
  const phaseIndex = PHASE_ORDER.indexOf(game.turno.fase);
  const canAct = game.turno.acoesRestantes > 0 && !game.vencedor;

  // Selected territory info
  const selectedTerritory = selectedId
    ? game.territories.find((t) => t.id === selectedId) ?? null
    : null;

  // Is the selected territory owned by the current player?
  const isOwnTerritory =
    selectedTerritory?.donoAtual === game.turno.jogadorAtualId;

  // Compute valid move targets (connected + same owner + within troop limit)
  const validMoveTargets = useMemo<Set<string>>(() => {
    if (actionMode.type !== "move_target") return new Set();
    const fromT = g.territories.find((t) => t.id === actionMode.fromId);
    if (!fromT) return new Set();
    const reachable = fromT.connections;
    return new Set(
      reachable.filter((id) => {
        const t = g.territories.find((t2) => t2.id === id);
        if (!t) return false;
        if (t.donoAtual !== g.turno.jogadorAtualId) return false;
        if (t.tropasAtuais >= TROOP_LIMITS[t.type]) return false;
        return true;
      })
    );
  }, [actionMode, g.territories, g.turno.jogadorAtualId]);

  // Whether a territory has any valid adjacent friendly territory (for move)
  function hasValidMoveTargets(territoryId: string): boolean {
    const t = g.territories.find((t2) => t2.id === territoryId);
    if (!t || t.tropasAtuais < 2) return false;
    return t.connections.some((id) => {
      const adj = g.territories.find((t2) => t2.id === id);
      return (
        adj &&
        adj.donoAtual === g.turno.jogadorAtualId &&
        adj.tropasAtuais < TROOP_LIMITS[adj.type]
      );
    });
  }

  // ── Error display helper ──────────────────────────────────────────────────
  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  }

  // ── Map click handler ─────────────────────────────────────────────────────
  function handleTerritoryClick(id: string) {
    if (actionMode.type === "move_target") {
      if (id === actionMode.fromId) {
        setActionMode({ type: "idle" });
        return;
      }
      if (validMoveTargets.has(id)) {
        const fromT = g.territories.find((t) => t.id === actionMode.fromId)!;
        const toT = g.territories.find((t) => t.id === id)!;
        const destLimit = TROOP_LIMITS[toT.type];
        const maxCount = Math.min(fromT.tropasAtuais - 1, destLimit - toT.tropasAtuais);
        setActionMode({ type: "move_confirm", fromId: actionMode.fromId, toId: id, count: Math.min(1, maxCount), maxCount });
      }
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
    setActionMode({ type: "idle" });
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  function doRecruit() {
    if (!selectedId) return;
    const result = recruitTroopsAction(selectedId);
    if (!result.valid && result.reason) showError(result.reason);
  }

  function doMoveTroops() {
    if (!selectedId || !canAct) return;
    if (!hasValidMoveTargets(selectedId)) { showError("Nenhum território adjacente disponível."); return; }
    setActionMode({ type: "move_target", fromId: selectedId });
  }

  function confirmMove() {
    if (actionMode.type !== "move_confirm") return;
    const result = moveTroopsAction(actionMode.fromId, actionMode.toId, actionMode.count);
    if (!result.valid && result.reason) showError(result.reason);
    setActionMode({ type: "idle" });
  }

  function doFaithSafe() {
    if (actionMode.type !== "faith") return;
    const result = strengthenFaithAction(actionMode.territoryId, "safe");
    if (!result.valid && result.reason) showError(result.reason);
    setActionMode({ type: "idle" });
  }

  function startQuiz() {
    if (actionMode.type !== "faith") return;
    const questionIdx = Math.floor(Math.random() * QUIZ_QUESTIONS.length);
    setActionMode({ type: "quiz", territoryId: actionMode.territoryId, questionIdx });
  }

  function answerQuiz(optionIdx: number) {
    if (actionMode.type !== "quiz") return;
    const q = QUIZ_QUESTIONS[actionMode.questionIdx];
    const correct = optionIdx === q.correct;
    const territory = g.territories.find((t) => t.id === actionMode.territoryId);
    const difficult = territory ? territory.feAtual <= 39 : false;
    const delta = correct ? (difficult ? 10 : 15) : -5;
    const result = strengthenFaithAction(actionMode.territoryId, "quiz", correct);
    if (!result.valid && result.reason) showError(result.reason);
    setActionMode({ type: "quiz_result", territoryId: actionMode.territoryId, correct, delta });
    setTimeout(() => setActionMode({ type: "idle" }), 2200);
  }

  function doDiscard(cardId: string) {
    const result = discardCardAction(cardId);
    if (!result.valid && result.reason) showError(result.reason);
    setActionMode({ type: "idle" });
  }

  // ── Victory screen ────────────────────────────────────────────────────────
  if (game.vencedor) {
    const winner = game.players.find((p) => p.id === game.vencedor);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-center px-4">
        <div className="text-7xl mb-6">👑</div>
        <h1 className="text-4xl font-bold text-amber-100" style={{ fontFamily: "Georgia, serif" }}>Vitória!</h1>
        <p className="text-amber-300 text-2xl mt-2 font-semibold">{winner?.name}</p>
        <p className="text-amber-500/60 mt-3 text-sm">{game.log[game.log.length - 1]}</p>
        <button onClick={() => { resetGame(); setLocation("/"); }} className="mt-8 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all">
          Novo Jogo
        </button>
      </div>
    );
  }

  // ─── Action panel (sidebar) ───────────────────────────────────────────────
  const ActionPanel = () => {
    if (!selectedTerritory || !isOwnTerritory || !currentPlayer) return null;
    if (!canAct) return (
      <div className="px-4 py-3 border-t border-amber-900/30">
        <p className="text-amber-700 text-xs text-center">Sem ações restantes</p>
      </div>
    );

    const t = selectedTerritory;
    const limit = TROOP_LIMITS[t.type];
    const canRecruit = currentPlayer.resources.provisao >= 1 && t.tropasAtuais < limit;
    const canMove = t.tropasAtuais >= 2 && hasValidMoveTargets(t.id);
    const hasFaithAction = true;
    const hasCards = currentPlayer.cartasNaMao.length > 0;
    const difficult = t.feAtual <= 39;

    return (
      <div className="flex-shrink-0 border-t border-amber-900/30 p-3">
        <div className="text-amber-500 text-xs uppercase tracking-widest mb-2">Ações</div>
        <div className="flex flex-col gap-1.5">
          {/* Recrutar */}
          <button
            onClick={doRecruit}
            disabled={!canRecruit}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border flex items-center justify-between ${
              canRecruit
                ? "bg-green-900/30 border-green-700/30 text-green-300 hover:bg-green-800/40 active:scale-95"
                : "bg-stone-900/30 border-stone-800/30 text-stone-600 cursor-not-allowed"
            }`}
          >
            <span>⚔ Recrutar (+2 tropas)</span>
            <span className={canRecruit ? "text-green-500" : "text-stone-700"}>1 🌾</span>
          </button>

          {/* Mover tropas */}
          <button
            onClick={doMoveTroops}
            disabled={!canMove}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border flex items-center justify-between ${
              canMove
                ? "bg-blue-900/30 border-blue-700/30 text-blue-300 hover:bg-blue-800/40 active:scale-95"
                : "bg-stone-900/30 border-stone-800/30 text-stone-600 cursor-not-allowed"
            }`}
          >
            <span>↗ Mover tropas</span>
            <span className="text-amber-700 text-xs">1 ação</span>
          </button>

          {/* Fortalecer fé */}
          <button
            onClick={() => setActionMode({ type: "faith", territoryId: t.id })}
            disabled={!hasFaithAction}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border bg-purple-900/30 border-purple-700/30 text-purple-300 hover:bg-purple-800/40 active:scale-95 flex items-center justify-between"
          >
            <span>✦ Fortalecer fé{difficult ? " (difícil)" : ""}</span>
            <span className="text-amber-700 text-xs">1 ação</span>
          </button>

          {/* Descartar carta */}
          {hasCards ? (
            <button
              onClick={() => setActionMode({ type: "discard" })}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border bg-amber-900/30 border-amber-700/30 text-amber-300 hover:bg-amber-800/40 active:scale-95 flex items-center justify-between"
            >
              <span>🃏 Descartar carta</span>
              <span className="text-amber-700 text-xs">1 ação</span>
            </button>
          ) : (
            <div className="text-stone-700 text-xs px-1">Sem cartas na mão</div>
          )}
        </div>
      </div>
    );
  };

  const moveSourceId = actionMode.type === "move_target" ? actionMode.fromId : null;

  return (
    <div className="h-screen flex flex-col bg-stone-950 text-amber-100 overflow-hidden">

      {/* ── Error toast ────────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-700/60 text-red-200 text-sm px-4 py-2 rounded-xl shadow-xl backdrop-blur-sm pointer-events-none">
          {errorMsg}
        </div>
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-amber-950/80 border-b border-amber-800/30 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-amber-500 text-xs font-semibold whitespace-nowrap">Rodada {game.turno.rodada}</span>
          <span className="text-amber-800">·</span>
          <div
            className="text-xs font-bold px-2 py-0.5 rounded truncate max-w-[110px]"
            style={{ backgroundColor: (currentPlayer?.color ?? "#666") + "2a", color: currentPlayer?.color ?? "#aaa" }}
          >
            {currentPlayer?.name}
          </div>
        </div>

        {/* Phase breadcrumb */}
        <div className="hidden sm:flex items-center gap-1">
          {PHASE_ORDER.map((phase, i) => (
            <div key={phase} className="flex items-center gap-1">
              <span className={`text-xs px-1.5 py-0.5 rounded transition-all ${
                i === phaseIndex ? "bg-amber-700/50 text-amber-200 font-semibold"
                : i < phaseIndex ? "text-amber-800/40"
                : "text-amber-800/25"
              }`}>
                {PHASE_LABELS[phase]}
              </span>
              {i < PHASE_ORDER.length - 1 && <span className="text-amber-800/20 text-xs">›</span>}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Action pips */}
          <div className="flex gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < game.turno.acoesRestantes ? "bg-amber-400" : "bg-amber-900"}`} />
            ))}
          </div>
          <button onClick={saveGame} className="text-amber-700 hover:text-amber-400 text-xs px-2 py-1 rounded border border-amber-800/30 hover:border-amber-600/40 transition-all">Salvar</button>
          <button onClick={() => { saveGame(); setLocation("/"); }} className="text-amber-800 hover:text-amber-500 text-xs transition-colors">Sair</button>
        </div>
      </header>

      {/* ── Move mode banner ───────────────────────────────────────────────── */}
      {actionMode.type === "move_target" && (
        <div className="flex-shrink-0 flex items-center justify-between bg-green-950/70 border-b border-green-800/40 px-4 py-2">
          <span className="text-green-300 text-xs font-semibold">
            ↗ Selecione o território de destino no mapa (destacado em verde)
          </span>
          <button onClick={() => setActionMode({ type: "idle" })} className="text-green-600 hover:text-green-400 text-xs transition-colors">
            cancelar
          </button>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 relative">
          <GameMap
            territories={game.territories}
            players={game.players}
            selectedId={actionMode.type === "move_target" ? actionMode.fromId : selectedId}
            currentPlayerId={game.turno.jogadorAtualId}
            moveSourceId={moveSourceId}
            validMoveTargets={validMoveTargets}
            onSelect={handleTerritoryClick}
          />
          {!selectedId && actionMode.type === "idle" && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-amber-800/50 text-xs pointer-events-none">
              Clique em um território para ver detalhes e ações
            </div>
          )}
        </main>

        {/* ── Right sidebar ───────────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 flex flex-col bg-stone-950 border-l border-amber-900/20 overflow-y-auto">

          {/* Territory detail + actions */}
          {selectedTerritory && actionMode.type === "idle" ? (
            <>
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-amber-500 text-xs uppercase tracking-widest">Território</span>
                <button onClick={() => setSelectedId(null)} className="text-amber-800 hover:text-amber-500 text-xs">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TerritoryDetail
                  territory={selectedTerritory}
                  players={game.players}
                  currentPlayerId={game.turno.jogadorAtualId}
                />
              </div>
              <ActionPanel />
            </>
          ) : (
            /* Player overview */
            <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
              <div>
                <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-2">Facções</h3>
                <div className="flex flex-col gap-1.5">
                  {game.players.map((p) => {
                    const controlled = game.territories.filter((t) => t.donoAtual === p.id).length;
                    const isActive = p.id === game.turno.jogadorAtualId;
                    return (
                      <div key={p.id} className={`rounded-lg px-2.5 py-2 ${isActive ? "bg-amber-900/40 ring-1 ring-amber-700/30" : "bg-stone-900/30"}`}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                            <span className="text-amber-200 text-xs font-medium truncate">{p.name}</span>
                            {p.isBot && <span className="text-amber-800 text-xs">bot</span>}
                          </div>
                          <span className="text-amber-700 text-xs flex-shrink-0">{controlled} terr.</span>
                        </div>
                        <div className="h-1 rounded-full bg-stone-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(1, p.resources.legado / legadoMax) * 100}%`, backgroundColor: p.color }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-amber-800 text-xs">Legado</span>
                          <span className="text-amber-700 text-xs">{p.resources.legado}/{legadoMax}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Resources */}
          {currentPlayer && (
            <div className="flex-shrink-0 border-t border-amber-900/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-amber-500 text-xs uppercase tracking-widest">Recursos</h3>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ color: currentPlayer.color, backgroundColor: currentPlayer.color + "22" }}>
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
                        <span className="text-xs font-bold" style={{ color: r.color }}>{val}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-stone-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(1, val / r.max) * 100}%`, backgroundColor: r.color }} />
                      </div>
                      <div className="text-amber-800 text-xs mt-0.5">{r.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Turn controls */}
          <div className="flex-shrink-0 border-t border-amber-900/20 p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-amber-500 text-xs uppercase tracking-widest">{PHASE_LABELS[game.turno.fase]}</span>
              <span className="text-amber-700 text-xs">{game.turno.acoesRestantes} ações</span>
            </div>
            {game.turno.fase !== "fim_turno" && (
              <button onClick={nextPhase} className="w-full py-1.5 text-xs font-semibold text-amber-300 bg-amber-900/30 hover:bg-amber-800/50 border border-amber-700/20 rounded-lg transition-all">
                Próxima fase →
              </button>
            )}
            <button onClick={finishTurn} className="w-full py-2.5 text-sm font-bold text-white bg-amber-700 hover:bg-amber-600 active:bg-amber-800 rounded-lg transition-all">
              Passar turno
            </button>
          </div>

          {/* Log */}
          <div className="flex-shrink-0 border-t border-amber-900/20 p-3 max-h-36 overflow-hidden">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-1.5">Histórico</h3>
            <div className="flex flex-col-reverse gap-0.5 overflow-y-auto max-h-24">
              {[...game.log].reverse().slice(0, 25).map((entry, i) => (
                <p key={i} className={`text-xs leading-relaxed ${entry.startsWith("──") ? "text-amber-600/80 font-semibold mt-1" : "text-amber-700/60"}`}>
                  {entry}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
         ════════════════════════════════════════════════════════════════════ */}

      {/* ── Move confirm modal ──────────────────────────────────────────────── */}
      {actionMode.type === "move_confirm" && (() => {
        const fromT = game.territories.find((t) => t.id === actionMode.fromId)!;
        const toT = game.territories.find((t) => t.id === actionMode.toId)!;
        return (
          <Modal onClose={() => setActionMode({ type: "idle" })}>
            <h2 className="text-amber-200 font-bold text-base mb-1">Mover tropas</h2>
            <p className="text-amber-600/70 text-xs mb-4">
              {fromT.name} → {toT.name}
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setActionMode({ ...actionMode, count: Math.max(1, actionMode.count - 1) })}
                disabled={actionMode.count <= 1}
                className="w-10 h-10 rounded-xl bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 text-xl font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
              >−</button>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-100">{actionMode.count}</div>
                <div className="text-amber-600 text-xs mt-0.5">de {fromT.tropasAtuais - 1} disponíveis</div>
              </div>
              <button
                onClick={() => setActionMode({ ...actionMode, count: Math.min(actionMode.maxCount, actionMode.count + 1) })}
                disabled={actionMode.count >= actionMode.maxCount}
                className="w-10 h-10 rounded-xl bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 text-xl font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
              >+</button>
            </div>
            <div className="text-amber-700/60 text-xs text-center mb-4">
              {fromT.name} ficará com {fromT.tropasAtuais - actionMode.count} tropa(s) · {toT.name} terá {toT.tropasAtuais + actionMode.count}/{TROOP_LIMITS[toT.type]}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActionMode({ type: "idle" })} className="flex-1 py-2 text-amber-600 text-sm border border-amber-800/30 rounded-lg hover:bg-amber-900/20 transition-all">
                Cancelar
              </button>
              <button onClick={confirmMove} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm rounded-lg transition-all">
                Confirmar
              </button>
            </div>
          </Modal>
        );
      })()}

      {/* ── Faith modal ─────────────────────────────────────────────────────── */}
      {actionMode.type === "faith" && (() => {
        const t = game.territories.find((tt) => tt.id === actionMode.territoryId)!;
        const difficult = t.feAtual <= 39;
        const faithInfo = getFaithInfo(t.feAtual);
        return (
          <Modal onClose={() => setActionMode({ type: "idle" })}>
            <h2 className="text-amber-200 font-bold text-base mb-1">Fortalecer Fé</h2>
            <p className="text-amber-600/70 text-xs mb-1">{t.name}</p>
            <div className="flex items-center gap-1.5 mb-5">
              <span className="text-xs px-2 py-0.5 rounded" style={{ color: faithInfo.color, backgroundColor: faithInfo.color + "22" }}>
                {faithInfo.label}
              </span>
              <span className="text-amber-700 text-xs">Fé atual: {t.feAtual}</span>
              {difficult && <span className="text-red-500/80 text-xs">(difícil)</span>}
            </div>

            <div className="flex flex-col gap-3">
              {/* Safe option */}
              <button
                onClick={doFaithSafe}
                className="w-full p-4 text-left rounded-xl bg-emerald-900/30 border border-emerald-700/30 hover:bg-emerald-800/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-300 font-semibold text-sm">✦ Opção Segura</span>
                  <span className="text-emerald-400 font-bold">+{difficult ? 5 : 10} fé</span>
                </div>
                <p className="text-emerald-700/80 text-xs">
                  {difficult
                    ? "Território de difícil conversão. Ganho reduzido."
                    : "Ação garantida. Bônus padrão de fé."}
                </p>
              </button>

              {/* Quiz option */}
              <button
                onClick={startQuiz}
                className="w-full p-4 text-left rounded-xl bg-purple-900/30 border border-purple-700/30 hover:bg-purple-800/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-purple-300 font-semibold text-sm">📖 Quiz Bíblico</span>
                  <div className="text-right">
                    <span className="text-purple-400 font-bold block">+{difficult ? 10 : 15} se acertar</span>
                    <span className="text-red-500/70 text-xs">-5 se errar</span>
                  </div>
                </div>
                <p className="text-purple-700/80 text-xs">Responda uma questão bíblica para ganho maior.</p>
              </button>
            </div>

            <button onClick={() => setActionMode({ type: "idle" })} className="w-full mt-3 py-1.5 text-amber-700 text-xs hover:text-amber-500 transition-colors">
              Cancelar
            </button>
          </Modal>
        );
      })()}

      {/* ── Quiz modal ──────────────────────────────────────────────────────── */}
      {actionMode.type === "quiz" && (() => {
        const q = QUIZ_QUESTIONS[actionMode.questionIdx];
        return (
          <Modal onClose={() => setActionMode({ type: "idle" })}>
            <div className="text-amber-500/60 text-xs uppercase tracking-widest mb-3">Quiz Bíblico</div>
            <h2 className="text-amber-100 font-semibold text-sm leading-relaxed mb-5">{q.question}</h2>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => answerQuiz(idx)}
                  className="w-full py-3 px-4 text-left text-sm rounded-xl bg-amber-900/30 border border-amber-700/30 hover:bg-amber-800/50 text-amber-200 transition-all active:scale-95"
                >
                  <span className="text-amber-600 font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={() => setActionMode({ type: "idle" })} className="w-full mt-4 text-amber-800 text-xs hover:text-amber-600 transition-colors">
              Cancelar (sem bônus)
            </button>
          </Modal>
        );
      })()}

      {/* ── Quiz result ─────────────────────────────────────────────────────── */}
      {actionMode.type === "quiz_result" && (
        <Modal onClose={() => setActionMode({ type: "idle" })}>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">{actionMode.correct ? "✅" : "❌"}</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: actionMode.correct ? "#4ade80" : "#f87171" }}>
              {actionMode.correct ? "Correto!" : "Errado..."}
            </h2>
            <p className="text-amber-200 text-lg font-bold">
              {actionMode.delta > 0 ? `+${actionMode.delta}` : actionMode.delta} fé
            </p>
            <p className="text-amber-600/60 text-xs mt-2">Fechando automaticamente...</p>
          </div>
        </Modal>
      )}

      {/* ── Discard card modal ──────────────────────────────────────────────── */}
      {actionMode.type === "discard" && (() => {
        const cards = currentPlayer?.cartasNaMao ?? [];
        return (
          <Modal onClose={() => setActionMode({ type: "idle" })}>
            <h2 className="text-amber-200 font-bold text-base mb-1">Descartar Carta</h2>
            <p className="text-amber-600/70 text-xs mb-4">Escolha uma carta para descartar. Custa 1 ação.</p>
            {cards.length === 0 ? (
              <p className="text-amber-700 text-sm text-center py-4">Sem cartas na mão.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => doDiscard(card.id)}
                    className="w-full text-left p-3 rounded-xl bg-amber-900/30 border border-amber-700/30 hover:bg-amber-800/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-amber-200 font-semibold text-sm">{card.name}</span>
                      <span className="text-amber-600 text-xs capitalize">{card.type}</span>
                    </div>
                    <p className="text-amber-700/70 text-xs">{card.description}</p>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setActionMode({ type: "idle" })} className="w-full mt-3 py-1.5 text-amber-700 text-xs hover:text-amber-500 transition-colors">
              Cancelar
            </button>
          </Modal>
        );
      })()}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-stone-900 border border-amber-800/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
