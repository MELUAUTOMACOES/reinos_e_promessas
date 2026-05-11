
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { TERRITORIES } from "@/game-data/territories";

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { game, advancePhase, endTurn, saveGame, resetGame } = useGameStore();

  if (!game) {
    setLocation("/");
    return null;
  }

  const currentPlayer = game.players.find((p) => p.id === game.currentPlayerId);
  const phaseLabels: Record<string, string> = {
    production: "Produção",
    cards: "Cartas",
    movement: "Movimento",
    combat: "Combate",
    end_turn: "Fim do Turno",
  };

  function handleQuit() {
    if (confirm("Sair da partida? O progresso será salvo.")) {
      saveGame();
      setLocation("/");
    }
  }

  if (game.winner) {
    const winner = game.players.find((p) => p.id === game.winner);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-950 text-center px-4">
        <div className="text-amber-400 text-6xl mb-4">👑</div>
        <h1 className="text-4xl font-bold text-amber-100" style={{ fontFamily: "Georgia, serif" }}>
          Vitória!
        </h1>
        <p className="text-amber-300 text-xl mt-2">{winner?.name}</p>
        <p className="text-amber-200/60 mt-4 max-w-sm">
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

  return (
    <div className="min-h-screen bg-stone-950 text-amber-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-amber-950/80 border-b border-amber-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-sm font-semibold">
            Rodada {game.turn}
          </span>
          <span className="text-amber-700">·</span>
          <span
            className="text-sm font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: currentPlayer?.color + "33", color: currentPlayer?.color }}
          >
            {currentPlayer?.name}
          </span>
          <span className="text-amber-600 text-sm">{phaseLabels[game.phase]}</span>
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
        {/* Map placeholder */}
        <main className="flex-1 relative flex items-center justify-center bg-stone-900/50">
          <div className="text-center text-amber-800/60">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-sm">Mapa interativo em desenvolvimento</p>
            <p className="text-xs mt-1">{TERRITORIES.length} territórios carregados</p>
          </div>
        </main>

        {/* Side panel */}
        <aside className="w-72 flex flex-col bg-amber-950/40 border-l border-amber-800/30 overflow-y-auto">
          {/* Players */}
          <div className="p-4 border-b border-amber-800/20">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">Facções</h3>
            <div className="flex flex-col gap-2">
              {game.players.map((p) => {
                const controlled = game.territories.filter((t) => t.ownerId === p.id).length;
                const isActive = p.id === game.currentPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      isActive ? "bg-amber-900/50 ring-1 ring-amber-600/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm font-medium text-amber-200">{p.name}</span>
                      {p.isBot && <span className="text-amber-700 text-xs">bot</span>}
                    </div>
                    <span className="text-amber-400 text-xs">{controlled} terr.</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current player resources */}
          {currentPlayer && (
            <div className="p-4 border-b border-amber-800/20">
              <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">Recursos</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-amber-300 font-bold text-lg">{currentPlayer.resources.gold}</div>
                  <div className="text-amber-600 text-xs">Ouro</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold text-lg">{currentPlayer.resources.food}</div>
                  <div className="text-amber-600 text-xs">Alimento</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold text-lg">{currentPlayer.faith}</div>
                  <div className="text-amber-600 text-xs">Fé</div>
                </div>
              </div>
            </div>
          )}

          {/* Phase actions */}
          <div className="p-4 border-b border-amber-800/20">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">
              Fase: {phaseLabels[game.phase]}
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => advancePhase()}
                className="w-full py-2 bg-amber-700/50 hover:bg-amber-700 text-amber-100 text-sm font-semibold rounded-lg transition-all border border-amber-600/30"
              >
                Avançar Fase
              </button>
              <button
                onClick={() => endTurn()}
                className="w-full py-2 bg-amber-900/50 hover:bg-amber-900 text-amber-300 text-sm rounded-lg transition-all border border-amber-800/30"
              >
                Encerrar Turno
              </button>
            </div>
          </div>

          {/* Log */}
          <div className="p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-amber-500 text-xs uppercase tracking-widest mb-3">Log</h3>
            <div className="flex flex-col-reverse gap-1 overflow-y-auto flex-1">
              {[...game.log].reverse().slice(0, 20).map((entry, i) => (
                <p key={i} className="text-amber-300/70 text-xs leading-relaxed">
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
