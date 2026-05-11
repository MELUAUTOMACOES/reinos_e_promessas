
import type { CombatResult, Territory, Player } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sword, Shield, Dices, TrendingUp, TrendingDown } from "lucide-react";

interface CombatModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatResult: CombatResult | null;
  attackerTerritory: Territory | null;
  defenderTerritory: Territory | null;
  attackerPlayer: Player | null;
  defenderPlayer: Player | null;
  troopsUsed: number;
}

const VICTORY_TYPE_LABELS: Record<string, string> = {
  empate: "Empate",
  apertada: "Vitória Apertada",
  clara: "Vitória Clara",
  esmagadora: "Vitória Esmagadora",
};

const VICTORY_TYPE_COLORS: Record<string, string> = {
  empate: "bg-gray-500",
  apertada: "bg-yellow-500",
  clara: "bg-orange-500",
  esmagadora: "bg-red-500",
};

export default function CombatModal({
  isOpen,
  onClose,
  combatResult,
  attackerTerritory,
  defenderTerritory,
  attackerPlayer,
  defenderPlayer,
  troopsUsed,
}: CombatModalProps) {
  if (!combatResult || !attackerTerritory || !defenderTerritory || !attackerPlayer) {
    return null;
  }

  const isAttackerWinner = combatResult.vencedor === 'atacante';
  const isDefenderWinner = combatResult.vencedor === 'defensor';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-amber-950 to-amber-900 border-amber-700 text-amber-50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-100 flex items-center gap-2">
            <Sword className="w-6 h-6 text-red-400" />
            Resultado do Combate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Territórios */}
          <div className="grid grid-cols-2 gap-4">
            {/* Atacante */}
            <div className={`p-4 rounded-lg border-2 ${isAttackerWinner ? 'border-green-500 bg-green-950/30' : 'border-amber-700 bg-amber-950/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sword className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-amber-100">Atacante</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: attackerPlayer.color }}
                  />
                  <span className="text-amber-200">{attackerPlayer.name}</span>
                </div>
                <div className="text-amber-300">{attackerTerritory.name}</div>
                <div className="text-amber-400 text-xs">{troopsUsed} tropas usadas</div>
              </div>
            </div>

            {/* Defensor */}
            <div className={`p-4 rounded-lg border-2 ${isDefenderWinner ? 'border-green-500 bg-green-950/30' : 'border-amber-700 bg-amber-950/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-amber-100">Defensor</h3>
              </div>
              <div className="space-y-1 text-sm">
                {defenderPlayer ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: defenderPlayer.color }}
                    />
                    <span className="text-amber-200">{defenderPlayer.name}</span>
                  </div>
                ) : (
                  <div className="text-amber-400 text-xs">Neutro</div>
                )}
                <div className="text-amber-300">{defenderTerritory.name}</div>
                <div className="text-amber-400 text-xs">{defenderTerritory.tropasAtuais} tropas</div>
              </div>
            </div>
          </div>

          {/* Dados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-950/50 p-3 rounded-lg border border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">Dado Atacante</span>
                </div>
                <span className="text-2xl font-bold text-amber-100">{combatResult.dadoAtacante}</span>
              </div>
            </div>
            <div className="bg-amber-950/50 p-3 rounded-lg border border-amber-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">Dado Defensor</span>
                </div>
                <span className="text-2xl font-bold text-amber-100">{combatResult.dadoDefensor}</span>
              </div>
            </div>
          </div>

          {/* Forças */}
          <div className="bg-amber-950/50 p-4 rounded-lg border border-amber-700">
            <h4 className="font-bold text-amber-100 mb-3">Força Total</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-amber-400 mb-1">Atacante</div>
                <div className="text-3xl font-bold text-amber-100">{combatResult.forcaAtacante}</div>
                <div className="text-xs text-amber-500 mt-1">
                  {troopsUsed} tropas + {combatResult.dadoAtacante} dado
                </div>
              </div>
              <div>
                <div className="text-xs text-amber-400 mb-1">Defensor</div>
                <div className="text-3xl font-bold text-amber-100">{combatResult.forcaDefensor}</div>
                <div className="text-xs text-amber-500 mt-1">
                  {defenderTerritory.tropasAtuais} tropas + {defenderTerritory.defesaNatural} defesa + {combatResult.bonusFe} fé + 1 base + {combatResult.dadoDefensor} dado
                </div>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gradient-to-r from-amber-900 to-amber-800 p-4 rounded-lg border-2 border-amber-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-amber-100">Resultado</h4>
              <Badge className={`${VICTORY_TYPE_COLORS[combatResult.tipoVitoria]} text-white`}>
                {VICTORY_TYPE_LABELS[combatResult.tipoVitoria]}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-amber-400 mb-1">Vencedor</div>
                <div className="text-lg font-bold text-amber-100">
                  {combatResult.vencedor === 'empate' ? 'Empate' : combatResult.vencedor === 'atacante' ? 'Atacante' : 'Defensor'}
                </div>
              </div>
              <div>
                <div className="text-xs text-amber-400 mb-1">Diferença</div>
                <div className="text-lg font-bold text-amber-100">{combatResult.diferenca}</div>
              </div>
              <div>
                <div className="text-xs text-amber-400 mb-1">Bônus Fé</div>
                <div className={`text-lg font-bold ${combatResult.bonusFe >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {combatResult.bonusFe >= 0 ? '+' : ''}{combatResult.bonusFe}
                </div>
              </div>
            </div>
          </div>

          {/* Perdas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-950/30 p-3 rounded-lg border border-red-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-red-300">Perdas Atacante</span>
              </div>
              <div className="text-2xl font-bold text-red-400">-{combatResult.atacantePerdas}</div>
            </div>
            <div className="bg-red-950/30 p-3 rounded-lg border border-red-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-red-300">Perdas Defensor</span>
              </div>
              <div className="text-2xl font-bold text-red-400">-{combatResult.defensorPerdas}</div>
            </div>
          </div>

          {/* Conquista */}
          {combatResult.conquistou && (
            <div className="bg-gradient-to-r from-green-900 to-green-800 p-4 rounded-lg border-2 border-green-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <span className="font-bold text-green-100 text-lg">
                  {defenderTerritory.name} foi conquistado!
                </span>
              </div>
              <p className="text-green-200 text-sm mt-2">
                O território agora pertence a {attackerPlayer.name} e está instável.
              </p>
            </div>
          )}

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="w-full bg-amber-700 hover:bg-amber-600 text-amber-50 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
