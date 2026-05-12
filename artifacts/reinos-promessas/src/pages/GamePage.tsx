import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import type { Card } from "@/types";
import { GAME_MODES, TROOP_LIMITS } from "@/types";
import { getFaithInfo } from "@/game-core/faith";
import { SECRET_OBJECTIVES } from "@/game-data/objectives";
import GameMap from "@/components/GameMap";

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

const MAP_POSITION_OFFSETS: Record<string, { x: number; y: number }> = {
  gaza: { x: -28, y: 16 },
  hebrom: { x: -28, y: 36 },
  belem: { x: -16, y: 12 },
  jerusalem: { x: 4, y: -28 },
  jerico: { x: 42, y: -10 },
  siquem: { x: 22, y: -8 },
  samaria: { x: 8, y: -26 },
  filistia: { x: -34, y: 6 },
  neguebe: { x: -14, y: 58 },
  edom: { x: 18, y: 54 },
  moabe: { x: 54, y: 34 },
  gileade: { x: 52, y: -30 },
  amom: { x: 70, y: 8 },
};

function getDisplayMapPosition(id: string, position: { x: number; y: number }) {
  const offset = MAP_POSITION_OFFSETS[id] ?? { x: 0, y: 0 };
  return { x: position.x + offset.x, y: position.y + offset.y };
}

type ActionMode =
  | { type: "idle" }
  | { type: "move_target"; fromId: string }
  | {
      type: "move_confirm";
      fromId: string;
      toId: string;
      count: number;
      maxCount: number;
    }
  | { type: "faith"; territoryId: string }
  | { type: "quiz"; territoryId: string; questionIdx: number }
  | {
      type: "quiz_result";
      territoryId: string;
      correct: boolean;
      delta: number;
    }
  | { type: "discard" }
  | { type: "attack_target"; fromId: string }
  | {
      type: "attack_confirm";
      fromId: string;
      toId: string;
      tropas: number;
      maxTropas: number;
    }
  | { type: "influence_target"; fromId: string }
  | {
      type: "influence_confirm";
      fromId: string;
      toId: string;
      influencia: number;
      ouro: number;
    }
  | { type: "buy_card" }
  | { type: "use_card" }
  | { type: "objective" }
  | { type: "legacy_help" }
  | { type: "card_detail"; cardId: string; source: "hand" | "market" };

export default function GamePage() {
  const [, setLocation] = useLocation();
  const {
    game,
    finishTurn,
    saveGame,
    resetGame,
    recruitTroopsAction,
    moveTroopsAction,
    strengthenFaithAction,
    discardCardAction,
    attackTerritoryAction,
    influenceTerritoryAction,
    buyRandomCard,
    buyMarketCard,
    activateCharacterAction,
    executeBotAction,
  } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>({ type: "idle" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const territoryCardRef = useRef<HTMLElement>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  if (!game) {
    setLocation("/");
    return null;
  }

  useEffect(() => {
    if (!game || game.vencedor) return;
    const cp = game.players.find((p) => p.id === game.turno.jogadorAtualId);
    if (!cp || !cp.isBot) return;

    if (game.turno.acoesRestantes <= 0) {
      const timer = setTimeout(() => finishTurn(), 800);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => executeBotAction(), 600);
    return () => clearTimeout(timer);
  }, [
    game?.turno.jogadorAtualId,
    game?.turno.acoesRestantes,
    game?.vencedor,
    executeBotAction,
    finishTurn,
  ]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [game?.log]);

  useEffect(() => {
    function updateViewportMode() {
      setIsCompactViewport(window.innerWidth < 900);
    }

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  const g = game;
  const currentPlayer = g.players.find((p) => p.id === g.turno.jogadorAtualId);
  const legadoMax = GAME_MODES[game.mode].legadoMaximo;
  const canAct =
    game.turno.acoesRestantes > 0 &&
    !game.vencedor &&
    !!currentPlayer &&
    !currentPlayer.isBot;
  const isHumanTurn = !!currentPlayer && !currentPlayer.isBot;

  const selectedTerritory = selectedId
    ? (game.territories.find((t) => t.id === selectedId) ?? null)
    : null;
  const isOwnTerritory =
    selectedTerritory?.donoAtual === game.turno.jogadorAtualId;

  const validMoveTargets = useMemo<Set<string>>(() => {
    if (actionMode.type !== "move_target") return new Set();
    const fromT = g.territories.find((t) => t.id === actionMode.fromId);
    if (!fromT) return new Set();
    return new Set(
      fromT.connections.filter((id) => {
        const t = g.territories.find((t2) => t2.id === id);
        return (
          t &&
          t.donoAtual === g.turno.jogadorAtualId &&
          t.tropasAtuais < TROOP_LIMITS[t.type]
        );
      }),
    );
  }, [actionMode, g.territories, g.turno.jogadorAtualId]);

  const validAttackTargets = useMemo<Set<string>>(() => {
    if (actionMode.type !== "attack_target") return new Set();
    const fromT = g.territories.find((t) => t.id === actionMode.fromId);
    if (!fromT) return new Set();
    return new Set(
      fromT.connections.filter((id) => {
        const t = g.territories.find((t2) => t2.id === id);
        return t && t.donoAtual !== g.turno.jogadorAtualId;
      }),
    );
  }, [actionMode, g.territories, g.turno.jogadorAtualId]);

  const validInfluenceTargets = useMemo<Set<string>>(() => {
    if (actionMode.type !== "influence_target") return new Set();
    const fromT = g.territories.find((t) => t.id === actionMode.fromId);
    if (!fromT) return new Set();
    return new Set(
      fromT.connections.filter((id) => {
        const t = g.territories.find((t2) => t2.id === id);
        return t && t.donoAtual !== g.turno.jogadorAtualId;
      }),
    );
  }, [actionMode, g.territories, g.turno.jogadorAtualId]);

  function hasValidMoveTargets(tid: string): boolean {
    const t = g.territories.find((t2) => t2.id === tid);
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
  function hasValidAttackTargets(tid: string): boolean {
    const t = g.territories.find((t2) => t2.id === tid);
    if (!t || t.tropasAtuais < 2) return false;
    return t.connections.some((id) => {
      const adj = g.territories.find((t2) => t2.id === id);
      return adj && adj.donoAtual !== g.turno.jogadorAtualId;
    });
  }
  function hasValidInfluenceTargets(tid: string): boolean {
    const t = g.territories.find((t2) => t2.id === tid);
    if (!t) return false;
    return t.connections.some((id) => {
      const adj = g.territories.find((t2) => t2.id === id);
      return adj && adj.donoAtual !== g.turno.jogadorAtualId;
    });
  }

  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3500);
  }

  function handleTerritoryClick(id: string) {
    if (actionMode.type === "move_target") {
      if (id === actionMode.fromId) {
        setActionMode({ type: "idle" });
        return;
      }
      if (validMoveTargets.has(id)) {
        const fromT = g.territories.find((t) => t.id === actionMode.fromId)!;
        const toT = g.territories.find((t) => t.id === id)!;
        const maxCount = Math.min(
          fromT.tropasAtuais - 1,
          TROOP_LIMITS[toT.type] - toT.tropasAtuais,
        );
        setActionMode({
          type: "move_confirm",
          fromId: actionMode.fromId,
          toId: id,
          count: Math.min(1, maxCount),
          maxCount,
        });
      }
      return;
    }
    if (actionMode.type === "attack_target") {
      if (id === actionMode.fromId) {
        setActionMode({ type: "idle" });
        return;
      }
      if (validAttackTargets.has(id)) {
        const fromT = g.territories.find((t) => t.id === actionMode.fromId)!;
        const maxTropas = fromT.tropasAtuais - 1;
        setActionMode({
          type: "attack_confirm",
          fromId: actionMode.fromId,
          toId: id,
          tropas: Math.min(1, maxTropas),
          maxTropas,
        });
      }
      return;
    }
    if (actionMode.type === "influence_target") {
      if (id === actionMode.fromId) {
        setActionMode({ type: "idle" });
        return;
      }
      if (validInfluenceTargets.has(id)) {
        setActionMode({
          type: "influence_confirm",
          fromId: actionMode.fromId,
          toId: id,
          influencia: 1,
          ouro: 0,
        });
      }
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
    setActionMode({ type: "idle" });
  }

  function doRecruit(territoryId: string) {
    const r = recruitTroopsAction(territoryId);
    if (!r.valid && r.reason) showError(r.reason);
  }
  function doMoveTroops(territoryId: string) {
    if (!canAct) return;
    if (!hasValidMoveTargets(territoryId)) {
      showError("Nenhum território adjacente disponível para mover.");
      return;
    }
    setActionMode({ type: "move_target", fromId: territoryId });
  }
  function confirmMove() {
    if (actionMode.type !== "move_confirm") return;
    const r = moveTroopsAction(
      actionMode.fromId,
      actionMode.toId,
      actionMode.count,
    );
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function doFaithSafe() {
    if (actionMode.type !== "faith") return;
    const r = strengthenFaithAction(actionMode.territoryId, "safe");
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function startQuiz() {
    if (actionMode.type !== "faith") return;
    setActionMode({
      type: "quiz",
      territoryId: actionMode.territoryId,
      questionIdx: Math.floor(Math.random() * QUIZ_QUESTIONS.length),
    });
  }
  function answerQuiz(optionIdx: number) {
    if (actionMode.type !== "quiz") return;
    const q = QUIZ_QUESTIONS[actionMode.questionIdx];
    const correct = optionIdx === q.correct;
    const territory = g.territories.find(
      (t) => t.id === actionMode.territoryId,
    );
    const difficult = territory ? territory.feAtual <= 39 : false;
    const delta = correct ? (difficult ? 10 : 15) : -5;
    const r = strengthenFaithAction(actionMode.territoryId, "quiz", correct);
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({
      type: "quiz_result",
      territoryId: actionMode.territoryId,
      correct,
      delta,
    });
    setTimeout(() => setActionMode({ type: "idle" }), 2200);
  }
  function doDiscard(cardId: string) {
    const r = discardCardAction(cardId);
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function doAttack() {
    if (actionMode.type !== "attack_confirm") return;
    const r = attackTerritoryAction(
      actionMode.fromId,
      actionMode.toId,
      actionMode.tropas,
    );
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function doInfluence() {
    if (actionMode.type !== "influence_confirm") return;
    const r = influenceTerritoryAction(
      actionMode.fromId,
      actionMode.toId,
      actionMode.influencia,
      actionMode.ouro,
    );
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function doBuyRandom() {
    const r = buyRandomCard();
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function doBuyMarket(cardId: string) {
    const r = buyMarketCard(cardId);
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }
  function doActivateChar(cardId: string) {
    const r = activateCharacterAction(cardId);
    if (!r.valid && r.reason) showError(r.reason);
    setActionMode({ type: "idle" });
  }

  if (game.vencedor) {
    const winner = game.players.find((p) => p.id === game.vencedor);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-center px-4">
        <div className="text-7xl mb-6">👑</div>
        <h1
          className="text-4xl font-bold text-amber-100"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Vitória!
        </h1>
        <p className="text-amber-300 text-2xl mt-2 font-semibold">
          {winner?.name}
        </p>
        <p className="text-amber-500/60 mt-3 text-sm">
          {game.log[game.log.length - 1]}
        </p>
        <button
          onClick={() => {
            resetGame();
            setLocation("/");
          }}
          className="mt-8 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all"
        >
          Novo Jogo
        </button>
      </div>
    );
  }

  const playerTerritories = g.territories.filter(
    (t) => t.donoAtual === g.turno.jogadorAtualId,
  );
  const canRecruitAny = playerTerritories.some(
    (t) =>
      currentPlayer &&
      currentPlayer.resources.provisao >= 1 &&
      t.tropasAtuais < TROOP_LIMITS[t.type],
  );
  const canMoveAny = playerTerritories.some((t) => hasValidMoveTargets(t.id));
  const canAttackAny = playerTerritories.some((t) =>
    hasValidAttackTargets(t.id),
  );
  const canInfluenceAny = playerTerritories.some((t) =>
    hasValidInfluenceTargets(t.id),
  );
  const canFaithAny = playerTerritories.length > 0;
  const canBuyRandom =
    currentPlayer &&
    currentPlayer.resources.ouro >= 2 &&
    currentPlayer.cartasNaMao.length < 5 &&
    g.deck.length > 0;
  const canBuyMarket =
    currentPlayer &&
    currentPlayer.resources.ouro >= 4 &&
    currentPlayer.cartasNaMao.length < 5 &&
    g.mercado.length > 0;
  const canUseChar =
    currentPlayer &&
    currentPlayer.cartasNaMao.some(
      (c) => c.type === "personagem" && currentPlayer.personagemAtivo === null,
    );
  const hasCards = currentPlayer && currentPlayer.cartasNaMao.length > 0;
  const currentObjective = currentPlayer?.objetivoSecretoId
    ? (SECRET_OBJECTIVES.find((obj) => obj.id === currentPlayer.objetivoSecretoId) ?? null)
    : null;

  const moveSourceId =
    actionMode.type === "move_target" ? actionMode.fromId : null;
  const attackSourceId =
    actionMode.type === "attack_target" ? actionMode.fromId : null;
  const influenceSourceId =
    actionMode.type === "influence_target" ? actionMode.fromId : null;
  const highlightSourceId =
    moveSourceId || attackSourceId || influenceSourceId || null;
  const highlightTargets =
    actionMode.type === "move_target"
      ? validMoveTargets
      : actionMode.type === "attack_target"
        ? validAttackTargets
        : actionMode.type === "influence_target"
          ? validInfluenceTargets
          : new Set<string>();

  const bannerMode =
    actionMode.type === "move_target"
      ? "move"
      : actionMode.type === "attack_target"
        ? "attack"
        : actionMode.type === "influence_target"
          ? "influence"
          : null;

  const bannerBg =
    bannerMode === "move"
      ? "bg-green-950/70 border-green-800/40"
      : bannerMode === "attack"
        ? "bg-red-950/70 border-red-800/40"
        : "bg-blue-950/70 border-blue-800/40";
  const bannerText =
    bannerMode === "move"
      ? "text-green-300"
      : bannerMode === "attack"
        ? "text-red-300"
        : "text-blue-300";
  const bannerLabel =
    bannerMode === "move"
      ? "Mover tropas"
      : bannerMode === "attack"
        ? "Atacar"
        : "Influenciar";
  const selectedOwner = selectedTerritory?.donoAtual
    ? (game.players.find((p) => p.id === selectedTerritory.donoAtual) ?? null)
    : null;
  const selectedFaith = selectedTerritory
    ? getFaithInfo(selectedTerritory.feAtual)
    : null;
  const selectedMapPosition = selectedTerritory
    ? getDisplayMapPosition(selectedTerritory.id, selectedTerritory.position)
    : null;
  const selectedPanelPosition = selectedTerritory
    ? isCompactViewport
      ? {
          left: "12px",
          right: "12px",
          bottom: "12px",
          top: "auto",
          transform: "none",
        }
      : {
          left: `${Math.min(78, Math.max(18, (((selectedMapPosition?.x ?? selectedTerritory.position.x) - 115) / 705) * 100))}%`,
          top: `${Math.min(74, Math.max(14, (((selectedMapPosition?.y ?? selectedTerritory.position.y) - 55) / 580) * 100))}%`,
          transform:
            (selectedMapPosition?.y ?? selectedTerritory.position.y) > 420
              ? (selectedMapPosition?.x ?? selectedTerritory.position.x) > 520
                ? "translate(-108%, calc(-100% + 28px))"
                : "translate(26px, calc(-100% + 28px))"
              : (selectedMapPosition?.x ?? selectedTerritory.position.x) > 520
                ? "translate(-108%, -20px)"
                : "translate(26px, -20px)",
        }
    : undefined;
  const inspectedCard =
    actionMode.type === "card_detail"
      ? actionMode.source === "hand"
        ? (currentPlayer?.cartasNaMao.find((card) => card.id === actionMode.cardId) ?? null)
        : (game.mercado.find((card) => card.id === actionMode.cardId) ?? null)
      : null;

  function handleBoardPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!selectedId) return;
    const target = event.target as Element;
    if (territoryCardRef.current?.contains(target)) return;
    if (target.closest("[data-territory-node='true']")) return;
    setSelectedId(null);
  }

  function getCardUseStatus(card: Card): { canUse: boolean; reason: string; cta: string } {
    if (!isHumanTurn) {
      return { canUse: false, reason: "Aguarde sua vez para usar cartas.", cta: "Usar carta" };
    }
    if (g.vencedor) {
      return { canUse: false, reason: "A partida já foi encerrada.", cta: "Usar carta" };
    }
    if (card.type === "personagem") {
      if (currentPlayer?.personagemAtivo) {
        return { canUse: false, reason: "Já existe um personagem ativo. Aguarde expirar.", cta: "Ativar personagem" };
      }
      return { canUse: true, reason: "Pode ativar agora. Personagens não exigem alvo.", cta: "Ativar personagem" };
    }
    if (card.type === "missao") {
      return { canUse: false, reason: "Missões são validadas pela condição cumprida; não são usadas manualmente.", cta: "Usar carta" };
    }
    return { canUse: false, reason: "Este tipo de carta ainda não possui ação manual implementada.", cta: "Usar carta" };
  }

  return (
    <div className="h-screen flex flex-col bg-[#080604] text-amber-100 overflow-hidden selection:bg-amber-500/30">
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 border border-red-500/50 text-red-100 text-sm px-5 py-3 rounded-2xl shadow-2xl shadow-red-950/40 backdrop-blur-md pointer-events-none">
          {errorMsg}
        </div>
      )}

      <header className="shrink-0 relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-r from-[#120904] via-[#241205] to-[#080604] shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,0.28),transparent_34%),radial-gradient(circle_at_76%_0%,rgba(120,53,15,0.38),transparent_42%)]" />
        <div className="relative flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 border border-amber-300/20 grid place-items-center shadow-inner shadow-amber-900/40">
              <span className="text-xl">👑</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-amber-500/80">
                  Reinos & Promessas
                </span>
                {currentPlayer?.isBot && (
                  <span className="text-[10px] uppercase tracking-wider text-amber-200/70 bg-amber-800/30 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                    Bot pensando
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-amber-100 font-black text-lg leading-none">
                  Rodada {game.turno.rodada}
                </span>
                <span className="text-amber-700">•</span>
                <span
                  className="text-sm font-bold truncate max-w-[240px]"
                  style={{ color: currentPlayer?.color ?? "#aaa" }}
                >
                  {currentPlayer?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            {currentPlayer && (
              <>
                <HudPill icon="🌾" label="Provisão" value={currentPlayer.resources.provisao} />
                <HudPill icon="🪙" label="Ouro" value={currentPlayer.resources.ouro} />
                <HudPill icon="👁" label="Influência" value={currentPlayer.resources.influencia} />
                <HudPill icon="⭐" label="Legado" value={`${currentPlayer.resources.legado}/${legadoMax}`} />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-2xl border border-amber-500/20 bg-black/25 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-amber-500/80">Ações</span>
                <div className="flex gap-1">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-7 rounded-full transition-all ${i < game.turno.acoesRestantes ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" : "bg-stone-800"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={saveGame}
              className="hidden sm:inline-flex text-amber-200/80 hover:text-amber-50 text-xs px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-950/20 hover:bg-amber-800/20 transition-all"
            >
              Salvar
            </button>
            <button
              onClick={() => {
                saveGame();
                setLocation("/");
              }}
              className="text-amber-500 hover:text-amber-200 text-xs px-3 py-2 rounded-xl hover:bg-amber-900/20 transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main
        className="relative flex-1 min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(146,64,14,0.2),transparent_42%),radial-gradient(circle_at_12%_78%,rgba(68,64,60,0.24),transparent_34%),linear-gradient(180deg,#080604,#0d0905)]"
        onPointerDown={handleBoardPointerDown}
      >
        <div className="absolute inset-0 px-0 py-0 md:px-1 md:py-1">
          <GameMap
            territories={game.territories}
            players={game.players}
            selectedId={highlightSourceId || selectedId}
            currentPlayerId={game.turno.jogadorAtualId}
            moveSourceId={highlightSourceId}
            validMoveTargets={highlightTargets}
            onSelect={handleTerritoryClick}
          />
        </div>

        {bannerMode && (
          <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md ${bannerBg}`}>
            <span className={`text-sm font-semibold ${bannerText}`}>
              {bannerLabel}: selecione o destino no mapa
            </span>
            <button
              onClick={() => setActionMode({ type: "idle" })}
              className="text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        <section className="absolute top-3 right-3 z-20 w-[300px] max-h-[calc(100%-11.5rem)] overflow-y-auto rounded-2xl border border-amber-500/20 bg-[#0d0a07]/88 shadow-2xl shadow-black/55 backdrop-blur-xl ring-1 ring-white/5 max-lg:w-[258px] max-md:top-2 max-md:right-2 max-md:left-2 max-md:w-auto max-md:max-h-[38vh]">
          <div className="p-4 border-b border-amber-500/10 bg-black/20 rounded-t-3xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-amber-500/75">Painel de comando</p>
                <h2 className="text-amber-100 font-black text-base leading-tight mt-1">
                  {isHumanTurn ? "Sua vez" : `${currentPlayer?.name ?? "Bot"} jogando`}
                </h2>
              </div>
              {!isHumanTurn && <div className="h-3 w-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_18px_rgba(251,191,36,0.8)]" />}
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {!isHumanTurn ? (
              <div className="rounded-2xl border border-amber-500/15 bg-amber-950/15 p-4 text-sm text-amber-300/80">
                O bot está executando as ações. Quando ficar sem ações, o turno será encerrado automaticamente.
              </div>
            ) : !canAct ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-500/15 bg-black/25 p-4 text-sm text-amber-500/80 text-center">
                  Sem ações restantes.
                </div>
                <button
                  onClick={finishTurn}
                  className="w-full py-3 text-sm font-black text-white bg-amber-700 hover:bg-amber-600 active:bg-amber-800 rounded-2xl transition-all shadow-lg shadow-amber-950/30"
                >
                  Encerrar turno
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <ActionBtn
                    label="Recrutar"
                    icon="⚔"
                    cost="1 🌾"
                    color="green"
                    disabled={!canRecruitAny}
                    tooltip={!canRecruitAny ? "Sem provisão ou territórios no limite" : "Adiciona +2 tropas em um território seu"}
                    onClick={() => {
                      if (selectedTerritory && isOwnTerritory) doRecruit(selectedTerritory.id);
                      else if (playerTerritories.length === 1) doRecruit(playerTerritories[0].id);
                      else showError("Selecione um território seu no mapa primeiro.");
                    }}
                  />
                  <ActionBtn
                    label="Mover"
                    icon="↗"
                    cost="1 ação"
                    color="blue"
                    disabled={!canMoveAny}
                    tooltip={!canMoveAny ? "Sem tropas para mover ou sem destino válido" : "Mova tropas entre territórios seus"}
                    onClick={() => {
                      if (selectedTerritory && isOwnTerritory) doMoveTroops(selectedTerritory.id);
                      else if (playerTerritories.length === 1) doMoveTroops(playerTerritories[0].id);
                      else showError("Selecione um território seu no mapa primeiro.");
                    }}
                  />
                  <ActionBtn
                    label="Atacar"
                    icon="⚔"
                    cost="1 ação"
                    color="red"
                    disabled={!canAttackAny}
                    tooltip={!canAttackAny ? "Sem tropas para atacar ou sem alvo adjacente" : "Ataque um território vizinho inimigo ou neutro"}
                    onClick={() => {
                      if (selectedTerritory && isOwnTerritory && hasValidAttackTargets(selectedTerritory.id)) setActionMode({ type: "attack_target", fromId: selectedTerritory.id });
                      else if (playerTerritories.length === 1) setActionMode({ type: "attack_target", fromId: playerTerritories[0].id });
                      else showError("Selecione um território seu com alvo adjacente.");
                    }}
                  />
                  <ActionBtn
                    label="Influenciar"
                    icon="👁"
                    cost="1 ação"
                    color="indigo"
                    disabled={!canInfluenceAny}
                    tooltip={!canInfluenceAny ? "Sem alvo adjacente" : "Tente domínio por influência"}
                    onClick={() => {
                      if (selectedTerritory && isOwnTerritory && hasValidInfluenceTargets(selectedTerritory.id)) setActionMode({ type: "influence_target", fromId: selectedTerritory.id });
                      else if (playerTerritories.length === 1) setActionMode({ type: "influence_target", fromId: playerTerritories[0].id });
                      else showError("Selecione um território seu com alvo adjacente.");
                    }}
                  />
                  <ActionBtn
                    label="Fé"
                    icon="✦"
                    cost="1 ação"
                    color="purple"
                    disabled={!canFaithAny}
                    tooltip={!canFaithAny ? "Você não controla nenhum território" : "Aumente a fé em um território seu"}
                    onClick={() => {
                      if (selectedTerritory && isOwnTerritory) setActionMode({ type: "faith", territoryId: selectedTerritory.id });
                      else if (playerTerritories.length === 1) setActionMode({ type: "faith", territoryId: playerTerritories[0].id });
                      else showError("Selecione um território seu no mapa primeiro.");
                    }}
                  />
                  <ActionBtn
                    label="Comprar"
                    icon="🏪"
                    cost="2/4 🪙"
                    color="yellow"
                    disabled={!canBuyRandom && !canBuyMarket}
                    tooltip="Compre carta aleatória ou carta aberta do mercado"
                    onClick={() => setActionMode({ type: "buy_card" })}
                  />
                </div>

                <button
                  onClick={() => setActionMode({ type: "objective" })}
                  className="w-full py-2.5 rounded-xl text-xs font-black border border-amber-500/25 bg-amber-900/30 text-amber-200 hover:bg-amber-800/40 transition-all"
                >
                  Objetivo
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      const firstCard = currentPlayer?.cartasNaMao[0];
                      if (firstCard) setActionMode({ type: "card_detail", cardId: firstCard.id, source: "hand" });
                    }}
                    disabled={!hasCards}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${hasCards ? "bg-purple-900/30 border-purple-700/30 text-purple-300 hover:bg-purple-800/40" : "bg-stone-900/25 border-stone-800/30 text-stone-600 cursor-not-allowed"}`}
                  >
                    Cartas
                  </button>
                  <button
                    onClick={() => setActionMode({ type: "discard" })}
                    disabled={!hasCards}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${hasCards ? "bg-stone-800/45 border-stone-600/30 text-stone-300 hover:bg-stone-700/50" : "bg-stone-900/25 border-stone-800/30 text-stone-600 cursor-not-allowed"}`}
                  >
                    Descartar
                  </button>
                </div>

                <button
                  onClick={finishTurn}
                  className="w-full py-3 text-sm font-black text-white bg-amber-700 hover:bg-amber-600 active:bg-amber-800 rounded-2xl transition-all shadow-lg shadow-amber-950/30"
                >
                  Encerrar turno
                </button>
                <button
                  onClick={() => setActionMode({ type: "legacy_help" })}
                  className="w-full -mt-1 py-2 text-[11px] font-bold text-amber-500 hover:text-amber-200 transition-colors"
                >
                  Como ganhar legado?
                </button>
              </>
            )}

            {currentPlayer && (
              <div className="rounded-2xl border border-amber-500/15 bg-black/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-amber-500/80">Mão</span>
                  <span className="text-[10px] text-amber-600">{currentPlayer.cartasNaMao.length}/5</span>
                </div>
                {currentPlayer.cartasNaMao.length === 0 ? (
                  <p className="text-xs text-amber-700/70">Nenhuma carta na mão.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {currentPlayer.cartasNaMao.slice(0, 5).map((card) => (
                      <button
                        key={card.id}
                        onClick={() => setActionMode({ type: "card_detail", cardId: card.id, source: "hand" })}
                        className="w-full text-left rounded-xl border border-amber-500/10 bg-amber-950/15 px-2.5 py-2 hover:border-amber-400/30 hover:bg-amber-900/25 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-200 truncate">{card.name}</span>
                          <span className="text-[10px] text-amber-600 capitalize shrink-0">{card.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="absolute top-3 left-3 z-20 w-[224px] rounded-2xl border border-amber-500/15 bg-[#0d0a07]/72 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden hidden xl:block">
          <div className="px-4 py-3 border-b border-amber-500/10 bg-black/20">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-500/75">Reinos</p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {game.players.map((p) => {
              const controlled = game.territories.filter((t) => t.donoAtual === p.id).length;
              const isActive = p.id === game.turno.jogadorAtualId;
              return (
                <div key={p.id} className={`rounded-2xl px-3 py-2.5 border ${isActive ? "bg-amber-900/35 border-amber-500/25" : "bg-black/20 border-amber-500/10"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-xs font-bold text-amber-100 truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-amber-600 shrink-0">{controlled} terr.</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-amber-600/80">
                    <span>⭐ {p.resources.legado}</span>
                    <span>🪙 {p.resources.ouro}</span>
                    <span>👁 {p.resources.influencia}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {selectedTerritory && (
          <section
            ref={territoryCardRef}
            className="absolute z-30 w-[318px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border bg-gradient-to-br from-[#181008]/95 via-[#0d0a07]/95 to-[#080604]/95 shadow-2xl shadow-black/65 backdrop-blur-xl ring-1 ring-white/5 max-md:fixed max-md:w-auto"
            style={{
              ...selectedPanelPosition,
              borderColor: selectedOwner?.color ?? "rgba(251, 191, 36, 0.35)",
            }}
          >
            <div
              className="h-1.5"
              style={{ backgroundColor: selectedOwner?.color ?? "#92400e" }}
            />
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-amber-500/10 bg-black/25">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-amber-500/75">Território selecionado</p>
                <h3 className="text-amber-100 font-black truncate">{selectedTerritory.name}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="h-8 w-8 rounded-full border border-amber-500/15 bg-black/25 text-amber-500 hover:text-amber-200 hover:bg-amber-900/30 transition-all">
                ✕
              </button>
            </div>
            <div className="max-h-[min(52vh,440px)] overflow-y-auto px-3.5 py-3 space-y-3 max-md:max-h-[45vh]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-amber-500/80">Dono</span>
                <span className="font-bold truncate" style={{ color: selectedOwner?.color ?? "#d6d3d1" }}>
                  {selectedOwner?.name ?? "Neutro"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Tropas" value={`${selectedTerritory.tropasAtuais}/${TROOP_LIMITS[selectedTerritory.type]}`} />
                <MiniStat label="Fé" value={`${selectedTerritory.feAtual}`} tone={selectedFaith?.color} />
                <MiniStat label="Tipo" value={selectedTerritory.type} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <ResourceChip label="Provisão" value={selectedTerritory.producao.provisao} color="text-green-300" />
                <ResourceChip label="Ouro" value={selectedTerritory.producao.ouro} color="text-yellow-300" />
                <ResourceChip label="Influ." value={selectedTerritory.producao.influencia} color="text-blue-300" />
              </div>
              {(selectedTerritory.producao.militar ?? 0) > 0 && (
                <div className="rounded-xl border border-red-500/15 bg-red-950/20 px-3 py-2 text-xs text-red-200">
                  Produção militar +{selectedTerritory.producao.militar}
                </div>
              )}
              <div className="rounded-xl border border-amber-500/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-500/80">Estabilidade</span>
                  <span className="font-bold" style={{ color: selectedFaith?.color ?? "#fbbf24" }}>
                    {selectedFaith?.label ?? selectedTerritory.estado}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-900">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedTerritory.feAtual}%`,
                      backgroundColor: selectedFaith?.color ?? "#fbbf24",
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTerritory.melhorias.length > 0 ? (
                  selectedTerritory.melhorias.map((melhoria) => (
                    <span key={melhoria} className="rounded-full border border-amber-500/15 bg-amber-950/25 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      {melhoria}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-amber-700/80">Sem melhorias ativas.</span>
                )}
              </div>
            </div>
            {isOwnTerritory && isHumanTurn && canAct && (
              <div className="border-t border-amber-500/10 p-3 bg-black/20">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => doRecruit(selectedTerritory.id)}
                    disabled={!currentPlayer || currentPlayer.resources.provisao < 1 || selectedTerritory.tropasAtuais >= TROOP_LIMITS[selectedTerritory.type]}
                    className="py-2 rounded-xl text-[11px] font-bold border bg-green-900/30 border-green-700/30 text-green-300 disabled:bg-stone-900/30 disabled:border-stone-800/30 disabled:text-stone-600"
                  >
                    Recrutar
                  </button>
                  <button
                    onClick={() => doMoveTroops(selectedTerritory.id)}
                    disabled={!hasValidMoveTargets(selectedTerritory.id)}
                    className="py-2 rounded-xl text-[11px] font-bold border bg-blue-900/30 border-blue-700/30 text-blue-300 disabled:bg-stone-900/30 disabled:border-stone-800/30 disabled:text-stone-600"
                  >
                    Mover
                  </button>
                  <button
                    onClick={() => setActionMode({ type: "faith", territoryId: selectedTerritory.id })}
                    className="py-2 rounded-xl text-[11px] font-bold border bg-purple-900/30 border-purple-700/30 text-purple-300"
                  >
                    Fé
                  </button>
                  <button
                    onClick={() => setActionMode({ type: "attack_target", fromId: selectedTerritory.id })}
                    disabled={!hasValidAttackTargets(selectedTerritory.id)}
                    className="py-2 rounded-xl text-[11px] font-bold border bg-red-900/30 border-red-700/30 text-red-300 disabled:bg-stone-900/30 disabled:border-stone-800/30 disabled:text-stone-600"
                  >
                    Atacar
                  </button>
                  <button
                    onClick={() => setActionMode({ type: "influence_target", fromId: selectedTerritory.id })}
                    disabled={!hasValidInfluenceTargets(selectedTerritory.id)}
                    className="py-2 rounded-xl text-[11px] font-bold border bg-indigo-900/30 border-indigo-700/30 text-indigo-300 disabled:bg-stone-900/30 disabled:border-stone-800/30 disabled:text-stone-600 col-span-2"
                  >
                    Influenciar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="absolute left-3 bottom-3 z-20 w-[380px] pointer-events-none max-lg:w-[340px] max-md:left-2 max-md:right-2 max-md:bottom-2 max-md:w-auto">
          <div className="rounded-2xl border border-amber-500/15 bg-[#0d0a07]/82 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden pointer-events-auto">
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-amber-500/10 bg-black/20">
              <span className="text-[10px] uppercase tracking-[0.22em] text-amber-500/75">Acontecimentos recentes</span>
              <span className="text-[10px] text-amber-700/75">{Math.min(12, game.log.length)} ultimos</span>
            </div>
            <div className="max-h-64 overflow-y-auto px-3.5 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-amber-900/50 scrollbar-track-transparent max-md:max-h-40">
              {game.log.slice(-12).map((entry, i) => (
                <p key={i} className={`text-xs leading-relaxed ${entry.startsWith("──") ? "text-amber-300 font-bold" : "text-amber-500/70"}`}>
                  {entry}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </section>

        {!selectedId && actionMode.type === "idle" && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-amber-200/55 text-xs pointer-events-none rounded-full border border-amber-500/15 bg-black/25 px-4 py-2 backdrop-blur-md">
            Clique em um território para abrir o painel flutuante
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════ MODALS ════════════════════════════════════════════════════════════════════ */}

      {actionMode.type === "move_confirm" &&
        (() => {
          const fromT = game.territories.find(
            (t) => t.id === actionMode.fromId,
          )!;
          const toT = game.territories.find((t) => t.id === actionMode.toId)!;
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <h2 className="text-amber-200 font-bold text-lg mb-1">
                Mover tropas
              </h2>
              <p className="text-amber-500/70 text-sm mb-4">
                {fromT.name} → {toT.name}
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() =>
                    setActionMode({
                      ...actionMode,
                      count: Math.max(1, actionMode.count - 1),
                    })
                  }
                  disabled={actionMode.count <= 1}
                  className="w-12 h-12 rounded-xl bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 text-2xl font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-5xl font-bold text-amber-100">
                    {actionMode.count}
                  </div>
                  <div className="text-amber-600 text-xs mt-1">
                    de {fromT.tropasAtuais - 1} disponíveis
                  </div>
                </div>
                <button
                  onClick={() =>
                    setActionMode({
                      ...actionMode,
                      count: Math.min(
                        actionMode.maxCount,
                        actionMode.count + 1,
                      ),
                    })
                  }
                  disabled={actionMode.count >= actionMode.maxCount}
                  className="w-12 h-12 rounded-xl bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 text-2xl font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
                >
                  +
                </button>
              </div>
              <p className="text-amber-600/60 text-xs text-center mb-4">
                {fromT.name} ficará com {fromT.tropasAtuais - actionMode.count}{" "}
                · {toT.name} terá {toT.tropasAtuais + actionMode.count}/
                {TROOP_LIMITS[toT.type]}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActionMode({ type: "idle" })}
                  className="flex-1 py-2.5 text-amber-500 text-sm border border-amber-800/30 rounded-xl hover:bg-amber-900/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmMove}
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Confirmar
                </button>
              </div>
            </Modal>
          );
        })()}

      {actionMode.type === "faith" &&
        (() => {
          const t = game.territories.find(
            (tt) => tt.id === actionMode.territoryId,
          )!;
          const difficult = t.feAtual <= 39;
          const faithInfo = getFaithInfo(t.feAtual);
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <h2 className="text-amber-200 font-bold text-lg mb-1">
                Fortalecer Fé
              </h2>
              <p className="text-amber-500/70 text-sm mb-1">{t.name}</p>
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{
                    color: faithInfo.color,
                    backgroundColor: faithInfo.color + "22",
                  }}
                >
                  {faithInfo.label}
                </span>
                <span className="text-amber-600 text-xs">Fé: {t.feAtual}</span>
                {difficult && (
                  <span className="text-red-400/80 text-xs font-semibold">
                    (difícil)
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={doFaithSafe}
                  className="w-full p-4 text-left rounded-xl bg-emerald-900/30 border border-emerald-700/30 hover:bg-emerald-800/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-emerald-300 font-semibold text-sm">
                      ✦ Opção Segura
                    </span>
                    <span className="text-emerald-400 font-bold">
                      +{difficult ? 5 : 10} fé
                    </span>
                  </div>
                  <p className="text-emerald-700/80 text-xs">
                    {difficult
                      ? "Território difícil. Ganho reduzido."
                      : "Ação garantida sem riscos."}
                  </p>
                </button>
                <button
                  onClick={startQuiz}
                  className="w-full p-4 text-left rounded-xl bg-purple-900/30 border border-purple-700/30 hover:bg-purple-800/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-purple-300 font-semibold text-sm">
                      📖 Quiz Bíblico
                    </span>
                    <div className="text-right">
                      <span className="text-purple-400 font-bold block">
                        +{difficult ? 10 : 15} se acertar
                      </span>
                      <span className="text-red-400/70 text-xs">
                        -5 se errar
                      </span>
                    </div>
                  </div>
                  <p className="text-purple-700/80 text-xs">
                    Responda uma pergunta bíblica para ganho maior.
                  </p>
                </button>
              </div>
              <button
                onClick={() => setActionMode({ type: "idle" })}
                className="w-full mt-4 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
              >
                Cancelar
              </button>
            </Modal>
          );
        })()}

      {actionMode.type === "quiz" &&
        (() => {
          const q = QUIZ_QUESTIONS[actionMode.questionIdx];
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <div className="text-amber-500/60 text-xs uppercase tracking-widest mb-3">
                Quiz Bíblico
              </div>
              <h2 className="text-amber-100 font-semibold text-base leading-relaxed mb-5">
                {q.question}
              </h2>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => answerQuiz(idx)}
                    className="w-full py-3 px-4 text-left text-sm rounded-xl bg-amber-900/30 border border-amber-700/30 hover:bg-amber-800/50 text-amber-200 transition-all active:scale-[0.98]"
                  >
                    <span className="text-amber-500 font-bold mr-2">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActionMode({ type: "idle" })}
                className="w-full mt-4 text-amber-700 text-xs hover:text-amber-500 transition-colors"
              >
                Cancelar
              </button>
            </Modal>
          );
        })()}

      {actionMode.type === "quiz_result" && (
        <Modal onClose={() => setActionMode({ type: "idle" })}>
          <div className="text-center py-4">
            <div className="text-6xl mb-3">
              {actionMode.correct ? "✅" : "❌"}
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: actionMode.correct ? "#4ade80" : "#f87171" }}
            >
              {actionMode.correct ? "Correto!" : "Errado..."}
            </h2>
            <p className="text-amber-200 text-xl font-bold">
              {actionMode.delta > 0 ? `+${actionMode.delta}` : actionMode.delta}{" "}
              fé
            </p>
            <p className="text-amber-600/50 text-xs mt-2">Fechando...</p>
          </div>
        </Modal>
      )}

      {actionMode.type === "discard" &&
        (() => {
          const cards = currentPlayer?.cartasNaMao ?? [];
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <h2 className="text-amber-200 font-bold text-lg mb-1">
                Descartar Carta
              </h2>
              <p className="text-amber-500/70 text-sm mb-4">
                Escolha uma carta para descartar. Custa 1 ação.
              </p>
              {cards.length === 0 ? (
                <p className="text-amber-600 text-sm text-center py-6">
                  Sem cartas na mão.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => doDiscard(card.id)}
                      className="w-full text-left p-3 rounded-xl bg-amber-900/30 border border-amber-700/30 hover:bg-amber-800/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-amber-200 font-semibold text-sm">
                          {card.name}
                        </span>
                        <span className="text-amber-500 text-xs capitalize">
                          {card.type}
                        </span>
                      </div>
                      <p className="text-amber-600/70 text-xs">
                        {card.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setActionMode({ type: "idle" })}
                className="w-full mt-4 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
              >
                Cancelar
              </button>
            </Modal>
          );
        })()}

      {actionMode.type === "attack_confirm" &&
        (() => {
          const fromT = game.territories.find(
            (t) => t.id === actionMode.fromId,
          )!;
          const toT = game.territories.find((t) => t.id === actionMode.toId)!;
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <h2 className="text-amber-200 font-bold text-lg mb-1">
                Confirmar Ataque
              </h2>
              <p className="text-amber-500/70 text-sm mb-4">
                {fromT.name} → {toT.name}
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() =>
                    setActionMode({
                      ...actionMode,
                      tropas: Math.max(1, actionMode.tropas - 1),
                    })
                  }
                  disabled={actionMode.tropas <= 1}
                  className="w-10 h-10 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-200 text-xl font-bold border border-red-700/30 disabled:opacity-30 transition-all"
                >
                  -
                </button>
                <div className="text-center">
                  <div className="text-4xl font-black text-red-100">
                    {actionMode.tropas}
                  </div>
                  <div className="text-amber-600 text-xs mt-1">
                    de {actionMode.maxTropas} disponiveis
                  </div>
                </div>
                <button
                  onClick={() =>
                    setActionMode({
                      ...actionMode,
                      tropas: Math.min(actionMode.maxTropas, actionMode.tropas + 1),
                    })
                  }
                  disabled={actionMode.tropas >= actionMode.maxTropas}
                  className="w-10 h-10 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-200 text-xl font-bold border border-red-700/30 disabled:opacity-30 transition-all"
                >
                  +
                </button>
              </div>
              <div className="bg-stone-900/60 rounded-xl p-3 mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600">Atacante:</span>
                  <span className="text-red-300 font-semibold">
                    {actionMode.tropas} tropas
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600">Defensor:</span>
                  <span className="text-blue-300 font-semibold">
                    {toT.tropasAtuais} tropas
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600">Tipo:</span>
                  <span className="text-amber-400 capitalize">{toT.type}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActionMode({ type: "idle" })}
                  className="flex-1 py-2.5 text-amber-500 text-sm border border-amber-800/30 rounded-xl hover:bg-amber-900/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={doAttack}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Atacar!
                </button>
              </div>
            </Modal>
          );
        })()}

      {actionMode.type === "influence_confirm" &&
        (() => {
          const fromT = game.territories.find(
            (t) => t.id === actionMode.fromId,
          )!;
          const toT = game.territories.find((t) => t.id === actionMode.toId)!;
          const maxInf = Math.min(currentPlayer?.resources.influencia ?? 0, 3);
          const maxOuro = Math.min(currentPlayer?.resources.ouro ?? 0, 4);
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <h2 className="text-amber-200 font-bold text-lg mb-1">
                Influenciar Território
              </h2>
              <p className="text-amber-500/70 text-sm mb-4">
                {fromT.name} → {toT.name}
              </p>
              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1 block">
                    Influência (1-{maxInf})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActionMode({
                          ...actionMode,
                          influencia: Math.max(1, actionMode.influencia - 1),
                        })
                      }
                      disabled={actionMode.influencia <= 1}
                      className="w-8 h-8 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
                    >
                      −
                    </button>
                    <span className="text-amber-100 text-lg font-bold w-8 text-center">
                      {actionMode.influencia}
                    </span>
                    <button
                      onClick={() =>
                        setActionMode({
                          ...actionMode,
                          influencia: Math.min(
                            maxInf,
                            actionMode.influencia + 1,
                          ),
                        })
                      }
                      disabled={actionMode.influencia >= maxInf}
                      className="w-8 h-8 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1 block">
                    Ouro (0-{maxOuro}, bônus a cada 2)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActionMode({
                          ...actionMode,
                          ouro: Math.max(0, actionMode.ouro - 1),
                        })
                      }
                      disabled={actionMode.ouro <= 0}
                      className="w-8 h-8 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
                    >
                      −
                    </button>
                    <span className="text-amber-100 text-lg font-bold w-8 text-center">
                      {actionMode.ouro}
                    </span>
                    <button
                      onClick={() =>
                        setActionMode({
                          ...actionMode,
                          ouro: Math.min(maxOuro, actionMode.ouro + 1),
                        })
                      }
                      disabled={actionMode.ouro >= maxOuro}
                      className="w-8 h-8 rounded-lg bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 font-bold border border-amber-700/30 disabled:opacity-30 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setActionMode({ type: "idle" })}
                  className="flex-1 py-2.5 text-amber-500 text-sm border border-amber-800/30 rounded-xl hover:bg-amber-900/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={doInfluence}
                  className="flex-1 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Influenciar
                </button>
              </div>
            </Modal>
          );
        })()}

      {actionMode.type === "buy_card" && (
        <Modal onClose={() => setActionMode({ type: "idle" })}>
          <h2 className="text-amber-200 font-bold text-lg mb-1">
            Comprar Carta
          </h2>
          <p className="text-amber-500/70 text-sm mb-5">
            Escolha como comprar:
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={doBuyRandom}
              disabled={!canBuyRandom}
              className={`w-full p-4 text-left rounded-xl border transition-all ${
                canBuyRandom
                  ? "bg-amber-900/30 border-amber-700/30 hover:bg-amber-800/40"
                  : "bg-stone-900/30 border-stone-800/30 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-200 font-semibold text-sm">
                  🎴 Carta Aleatória
                </span>
                <span className="text-yellow-400 font-bold text-sm">2 🪙</span>
              </div>
              <p className="text-amber-600/70 text-xs">
                Compre uma carta aleatória do baralho ({g.deck.length}{" "}
                restantes).
              </p>
            </button>
            <div className="rounded-xl bg-amber-900/20 border border-amber-700/25 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-200 font-semibold text-sm">🏪 Mercado aberto</span>
                <span className="text-yellow-400 font-bold text-sm">4 🪙</span>
              </div>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
                {g.mercado.length === 0 ? (
                  <p className="text-amber-600/70 text-xs">Nenhuma carta aberta no mercado.</p>
                ) : (
                  g.mercado.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setActionMode({ type: "card_detail", cardId: card.id, source: "market" })}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        canBuyMarket
                          ? "bg-yellow-900/25 border-yellow-700/30 hover:bg-yellow-800/35"
                          : "bg-stone-900/30 border-stone-800/30 hover:border-amber-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-amber-200 font-semibold text-xs truncate">{card.name}</span>
                        <span className="text-yellow-400 text-xs font-bold shrink-0">Comprar</span>
                      </div>
                      <p className="text-amber-600/70 text-[11px] line-clamp-2 mt-1">{card.description}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActionMode({ type: "idle" })}
            className="w-full mt-4 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
          >
            Cancelar
          </button>
        </Modal>
      )}

      {actionMode.type === "objective" && (
        <Modal onClose={() => setActionMode({ type: "idle" })}>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-950/20 p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-amber-500/80">
              Objetivo secreto
            </div>
            <h2 className="mt-2 text-xl font-black text-amber-100">
              {currentObjective?.name ?? "Objetivo ainda não definido"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-amber-200/80">
              {currentObjective?.description ??
                "Nenhum objetivo secreto foi encontrado no estado do jogador atual."}
            </p>
            {currentObjective && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/15 bg-black/25 px-3 py-2 text-xs">
                <span className="text-amber-600">Tier</span>
                <span className="font-bold uppercase text-amber-300">
                  {currentObjective.tier}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setActionMode({ type: "idle" })}
            className="w-full mt-4 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
          >
            Fechar
          </button>
        </Modal>
      )}

      {actionMode.type === "legacy_help" && (
        <Modal onClose={() => setActionMode({ type: "idle" })}>
          <h2 className="text-amber-200 font-bold text-lg mb-2">
            Como ganhar legado?
          </h2>
          <p className="text-amber-500/80 text-sm mb-3">
            Implementado agora: conquista ou domínio por influência gera legado pelo tipo do território. Ainda pendente: melhoria, missão e bônus completo de região por 1 rodada.
          </p>
          <div className="space-y-1.5 text-xs text-amber-200/85">
            <p>Comum conquistado: +3</p>
            <p>Estratégico conquistado: +6</p>
            <p>Sagrado/histórico conquistado: +10</p>
            <p>Capital/império conquistado: +15</p>
            <p>Construir melhoria: +2 ou +4 em cidade especial</p>
            <p>Cumprir missão: +25 a +30</p>
            <p>Controlar região completa por 1 rodada: +10</p>
          </div>
          <button
            onClick={() => setActionMode({ type: "idle" })}
            className="w-full mt-4 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
          >
            Fechar
          </button>
        </Modal>
      )}

      {actionMode.type === "card_detail" && inspectedCard && (
        <Modal onClose={() => setActionMode({ type: "idle" })}>
          {(() => {
            const status = getCardUseStatus(inspectedCard);
            const isMarket = actionMode.source === "market";
            return (
              <div className="mx-auto w-full max-w-[280px]">
                <div className="aspect-[5/7] rounded-2xl border border-amber-300/35 bg-gradient-to-br from-[#2a1809] via-[#120c08] to-[#050403] p-3 shadow-2xl shadow-black/60">
                  <div className="flex h-full flex-col rounded-xl border border-amber-500/20 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base font-black leading-tight text-amber-100">
                          {inspectedCard.name}
                        </h2>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-500">
                          {inspectedCard.type} · {inspectedCard.rarity}
                        </p>
                      </div>
                      <span className="rounded-full border border-amber-500/20 bg-amber-950/40 px-2 py-1 text-xs font-bold text-yellow-300">
                        {isMarket ? "4" : inspectedCard.cost ?? 0} ouro
                      </span>
                    </div>
                    <div className="my-4 grid flex-1 place-items-center rounded-xl border border-amber-500/15 bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.35),transparent_45%),linear-gradient(135deg,rgba(120,53,15,0.8),rgba(15,23,42,0.35))]">
                      <span className="text-5xl">{getCardIcon(inspectedCard.type)}</span>
                    </div>
                    <p className="min-h-[72px] text-xs leading-relaxed text-amber-100/85">
                      {inspectedCard.description || "Sem descrição."}
                    </p>
                    {inspectedCard.legacyPoints != null && (
                      <p className="mt-2 text-xs font-bold text-purple-300">
                        Legado: +{inspectedCard.legacyPoints}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-amber-500/15 bg-black/25 px-3 py-2">
                  <div className={`text-xs font-bold ${status.canUse || isMarket ? "text-green-300" : "text-red-300"}`}>
                    {isMarket ? "Pode comprar se houver ouro e espaço na mão." : status.canUse ? "Pode usar agora" : "Não pode usar agora"}
                  </div>
                  <p className="mt-1 text-xs text-amber-600/90">
                    {isMarket ? "A compra usa a regra atual do mercado: 4 ouro e 1 ação." : status.reason}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setActionMode({ type: "idle" })}
                    className="flex-1 py-2.5 text-amber-500 text-sm border border-amber-800/30 rounded-xl hover:bg-amber-900/20 transition-all"
                  >
                    Fechar
                  </button>
                  {isMarket ? (
                    <button
                      onClick={() => doBuyMarket(inspectedCard.id)}
                      disabled={!canBuyMarket}
                      className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Comprar
                    </button>
                  ) : (
                    <button
                      onClick={() => doActivateChar(inspectedCard.id)}
                      disabled={!status.canUse}
                      className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {status.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {actionMode.type === "use_card" &&
        (() => {
          const chars =
            currentPlayer?.cartasNaMao.filter((c) => c.type === "personagem") ??
            [];
          return (
            <Modal onClose={() => setActionMode({ type: "idle" })}>
              <h2 className="text-amber-200 font-bold text-lg mb-1">
                Usar Personagem
              </h2>
              <p className="text-amber-500/70 text-sm mb-4">
                Ative um personagem da sua mão. Apenas 1 ativo por vez.
              </p>
              {chars.length === 0 ? (
                <p className="text-amber-600 text-sm text-center py-6">
                  Nenhum personagem disponível.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {chars.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => doActivateChar(card.id)}
                      className="w-full text-left p-3 rounded-xl bg-purple-900/30 border border-purple-700/30 hover:bg-purple-800/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-purple-200 font-semibold text-sm">
                          {card.name}
                        </span>
                        <span className="text-purple-400 text-xs">Ativar</span>
                      </div>
                      <p className="text-purple-600/70 text-xs">
                        {card.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setActionMode({ type: "idle" })}
                className="w-full mt-4 py-2 text-amber-600 text-sm hover:text-amber-400 transition-colors"
              >
                Cancelar
              </button>
            </Modal>
          );
        })()}
    </div>
  );
}

function HudPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-[92px] rounded-2xl border border-amber-500/15 bg-black/25 px-3 py-2 shadow-inner shadow-amber-950/20">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-amber-100 font-black text-sm tabular-nums">
          {value}
        </span>
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-amber-600/80 truncate">
        {label}
      </div>
    </div>
  );
}

// ─── Action button component ──────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-amber-500/10 bg-black/25 px-2 py-2 text-center">
      <div
        className="text-sm font-black tabular-nums capitalize text-amber-100 truncate"
        style={{ color: tone }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-amber-600/80">
        {label}
      </div>
    </div>
  );
}

function ResourceChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-amber-500/10 bg-amber-950/15 px-2 py-2">
      <div className={`text-sm font-black ${color}`}>+{value}</div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-amber-700/80">
        {label}
      </div>
    </div>
  );
}

function getCardIcon(type: Card["type"]) {
  switch (type) {
    case "personagem":
      return "♚";
    case "tatica":
      return "⚔";
    case "missao":
      return "✦";
    case "evento":
      return "◆";
    default:
      return "◇";
  }
}

function ActionBtn({
  label,
  icon,
  cost,
  color,
  disabled,
  tooltip,
  onClick,
}: {
  label: string;
  icon: string;
  cost: string;
  color: string;
  disabled: boolean;
  tooltip: string;
  onClick: () => void;
}) {
  const colors: Record<
    string,
    { bg: string; border: string; text: string; hover: string }
  > = {
    green: {
      bg: "bg-green-900/30",
      border: "border-green-700/30",
      text: "text-green-300",
      hover: "hover:bg-green-800/40",
    },
    blue: {
      bg: "bg-blue-900/30",
      border: "border-blue-700/30",
      text: "text-blue-300",
      hover: "hover:bg-blue-800/40",
    },
    red: {
      bg: "bg-red-900/30",
      border: "border-red-700/30",
      text: "text-red-300",
      hover: "hover:bg-red-800/40",
    },
    indigo: {
      bg: "bg-indigo-900/30",
      border: "border-indigo-700/30",
      text: "text-indigo-300",
      hover: "hover:bg-indigo-800/40",
    },
    purple: {
      bg: "bg-purple-900/30",
      border: "border-purple-700/30",
      text: "text-purple-300",
      hover: "hover:bg-purple-800/40",
    },
    yellow: {
      bg: "bg-yellow-900/30",
      border: "border-yellow-700/30",
      text: "text-yellow-300",
      hover: "hover:bg-yellow-800/40",
    },
    amber: {
      bg: "bg-amber-900/30",
      border: "border-amber-700/30",
      text: "text-amber-300",
      hover: "hover:bg-amber-800/40",
    },
    stone: {
      bg: "bg-stone-800/30",
      border: "border-stone-700/30",
      text: "text-stone-400",
      hover: "hover:bg-stone-700/40",
    },
  };
  const c = colors[color] ?? colors.stone;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`group w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border flex flex-col gap-1 shadow-sm shadow-black/20 ${
        disabled
          ? "bg-stone-900/25 border-stone-800/30 text-stone-600 cursor-not-allowed"
          : `${c.bg} ${c.border} ${c.text} ${c.hover} hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]`
      }`}
    >
      <div className="flex items-center justify-between">
        <span>
          {icon} {label}
        </span>
        <span className={disabled ? "text-stone-700" : "text-amber-600/70"}>
          {cost}
        </span>
      </div>
      {disabled && (
        <span className="text-stone-700/50 text-[10px] leading-tight">
          {tooltip}
        </span>
      )}
    </button>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md" />
      <div
        className="relative z-10 bg-gradient-to-br from-[#19110a] via-stone-950 to-[#090705] border border-amber-400/25 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-black/70 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
