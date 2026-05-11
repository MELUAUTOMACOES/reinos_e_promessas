
import type { GameState, PlayerId } from "@/types";

interface VictoryScreenProps {
  game: GameState;
  winnerId: PlayerId;
  reason: string;
  onNewGame: () => void;
}

export default function VictoryScreen({ game, winnerId, reason, onNewGame }: VictoryScreenProps) {
  const winner = game.players.find((p) => p.id === winnerId);
  
  if (!winner) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-yellow-900 to-amber-950 border-4 border-yellow-600 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-4xl font-bold text-yellow-300 mb-2">Vitória!</h1>
          <h2 className="text-2xl text-white mb-6">{winner.name}</h2>
          
          <div className="bg-black/30 rounded-lg p-6 mb-6">
            <p className="text-lg text-gray-200 mb-4">{reason}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-black/20 rounded p-3">
                <div className="text-sm text-gray-400">Legado</div>
                <div className="text-2xl text-yellow-400 font-bold">{winner.resources.legado}</div>
              </div>
              <div className="bg-black/20 rounded p-3">
                <div className="text-sm text-gray-400">Territórios</div>
                <div className="text-2xl text-green-400 font-bold">
                  {game.territories.filter((t) => t.donoAtual === winnerId).length}
                </div>
              </div>
              <div className="bg-black/20 rounded p-3">
                <div className="text-sm text-gray-400">Ouro</div>
                <div className="text-2xl text-yellow-300 font-bold">{winner.resources.ouro}</div>
              </div>
              <div className="bg-black/20 rounded p-3">
                <div className="text-sm text-gray-400">Rodadas</div>
                <div className="text-2xl text-blue-400 font-bold">{game.turno.rodada}</div>
              </div>
            </div>
          </div>

          <button
            onClick={onNewGame}
            className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Nova Partida
          </button>
        </div>
      </div>
    </div>
  );
}
