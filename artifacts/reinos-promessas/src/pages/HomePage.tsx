
import { useState } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { startGame, hasSavedGame, resetGame, game } = useGameStore();
  const [showSetup, setShowSetup] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

  function handleNewGame() {
    setShowSetup(true);
  }

  function handleStartGame() {
    startGame(playerCount);
    setLocation("/game");
  }

  function handleContinue() {
    setLocation("/game");
  }

  function handleReset() {
    resetGame();
    setShowSetup(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-950 via-amber-900 to-stone-950 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center max-w-lg w-full">
        {/* Decorative cross symbol */}
        <div className="text-amber-400 text-5xl select-none">✦</div>

        {/* Title */}
        <div>
          <h1 className="text-5xl font-bold text-amber-100 tracking-wide drop-shadow-lg"
            style={{ fontFamily: "Georgia, serif", textShadow: "0 2px 20px rgba(217,119,6,0.6)" }}>
            Reinos &amp; Promessas
          </h1>
          <p className="mt-3 text-amber-300 text-lg tracking-widest uppercase text-sm">
            Estratégia Bíblica
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-amber-200/70 text-sm max-w-xs leading-relaxed">
          Conquiste as terras do Antigo Testamento, cumpra as promessas divinas e erga seu reino sobre a areia dos séculos.
        </p>

        {/* Setup form */}
        {showSetup ? (
          <div className="w-full bg-amber-950/60 border border-amber-700/40 rounded-xl p-6 flex flex-col gap-5 backdrop-blur-sm">
            <h2 className="text-amber-200 font-semibold text-lg">Nova Partida</h2>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-amber-300 text-sm">Número de jogadores</label>
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
              <p className="text-amber-500/60 text-xs mt-1">
                {playerCount === 2 ? "1 humano vs 1 bot" : `1 humano vs ${playerCount - 1} bots`}
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-amber-900/50 active:scale-95"
            >
              Iniciar Partida
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="text-amber-500 text-sm hover:text-amber-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleNewGame}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-900/50 active:scale-95 border border-amber-500/30"
            >
              Nova Partida
            </button>

            {hasSavedGame() && game && (
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 font-semibold rounded-xl transition-all border border-amber-700/40 backdrop-blur-sm active:scale-95"
              >
                Continuar Partida
                <span className="block text-amber-400/60 text-xs font-normal mt-0.5">
                  Turno {game.turn} · {game.players.find(p => !p.isBot)?.faction}
                </span>
              </button>
            )}

            {hasSavedGame() && (
              <button
                onClick={handleReset}
                className="text-amber-600/70 text-sm hover:text-amber-500 transition-colors mt-2"
              >
                Apagar partida salva
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-amber-800 text-xs mt-4">
          MVP · Sem backend · Partida salva localmente
        </p>
      </div>
    </div>
  );
}
