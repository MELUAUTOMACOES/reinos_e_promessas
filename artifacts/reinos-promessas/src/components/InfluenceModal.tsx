
import type { InfluenceResult, Territory, Player } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Coins, Dices, TrendingUp, TrendingDown, Target } from "lucide-react";

interface InfluenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  influenceResult: InfluenceResult | null;
  sourceTerritory: Territory | null;
  targetTerritory: Territory | null;
  player: Player | null;
  targetOwner: Player | null;
}

export default function InfluenceModal({
  isOpen,
  onClose,
  influenceResult,
  sourceTerritory,
  targetTerritory,
  player,
  targetOwner,
}: InfluenceModalProps) {
  if (!influenceResult || !sourceTerritory || !targetTerritory || !player) {
    return null;
  }

  const isNeutral = targetOwner === null;
  const isSuccess = influenceResult.sucesso;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 text-purple-50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Resultado da Influência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Territórios */}
          <div className="grid grid-cols-2 gap-4">
            {/* Origem */}
            <div className="p-4 rounded-lg border-2 border-purple-700 bg-purple-950/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-purple-100">Origem</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-purple-200">{player.name}</span>
                </div>
                <div className="text-purple-300">{sourceTerritory.name}</div>
              </div>
            </div>

            {/* Alvo */}
            <div className={`p-4 rounded-lg border-2 ${isSuccess ? 'border-green-500 bg-green-950/30' : 'border-purple-700 bg-purple-950/50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-purple-100">Alvo</h3>
              </div>
              <div className="space-y-1 text-sm">
                {targetOwner ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: targetOwner.color }}
                    />
                    <span className="text-purple-200">{targetOwner.name}</span>
                  </div>
                ) : (
                  <div className="text-purple-400 text-xs">Neutro</div>
                )}
                <div className="text-purple-300">{targetTerritory.name}</div>
              </div>
            </div>
          </div>

          {/* Investimento */}
          <div className="bg-purple-950/50 p-4 rounded-lg border border-purple-700">
            <h4 className="font-bold text-purple-100 mb-3">Investimento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300">Influência</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">{influenceResult.influenciaInvestida}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-purple-300">Ouro (bônus: +{influenceResult.bonusOuro})</span>
                </div>
                <div className="text-2xl font-bold text-purple-100">{influenceResult.ouroInvestido}</div>
              </div>
            </div>
          </div>

          {/* Dados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-950/50 p-3 rounded-lg border border-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300">Dado Atacante</span>
                </div>
                <span className="text-2xl font-bold text-purple-100">{influenceResult.dadoAtacante}</span>
              </div>
            </div>
            <div className="bg-purple-950/50 p-3 rounded-lg border border-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300">Dado Defensor</span>
                </div>
                <span className="text-2xl font-bold text-purple-100">{influenceResult.dadoDefensor}</span>
              </div>
            </div>
          </div>

          {/* Forças */}
          <div className="bg-purple-950/50 p-4 rounded-lg border border-purple-700">
            <h4 className="font-bold text-purple-100 mb-3">Força vs Resistência</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-purple-400 mb-1">Força do Atacante</div>
                <div className="text-3xl font-bold text-purple-100">{influenceResult.forcaAtacante}</div>
                <div className="text-xs text-purple-500 mt-1">
                  {influenceResult.influenciaInvestida} influência + {influenceResult.bonusOuro} ouro + {influenceResult.dadoAtacante} dado
                  {influenceResult.vulnerabilidadeRebelde > 0 && ` + ${influenceResult.vulnerabilidadeRebelde} (rebelde)`}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-400 mb-1">Resistência do Defensor</div>
                <div className="text-3xl font-bold text-purple-100">{influenceResult.resistenciaDefensor}</div>
                <div className="text-xs text-purple-500 mt-1">
                  {influenceResult.resistenciaBase} base + {influenceResult.bonusFe} fé + {influenceResult.dadoDefensor} dado
                </div>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className={`p-4 rounded-lg border-2 ${isSuccess ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-600' : 'bg-gradient-to-r from-red-900 to-red-800 border-red-600'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white">Resultado</h4>
              <Badge className={`${isSuccess ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {isSuccess ? 'Sucesso' : 'Falhou'}
              </Badge>
            </div>
            
            {isNeutral ? (
              <div className="space-y-2">
                {influenceResult.dominou ? (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                    <span className="font-bold text-green-100 text-lg">
                      {targetTerritory.name} foi dominado!
                    </span>
                  </div>
                ) : (
                  <div className="text-white">
                    <div className="font-bold mb-1">Progresso de Influência</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-purple-950/50 rounded-full h-4 overflow-hidden">
                        <div 
                          className="bg-purple-400 h-full transition-all"
                          style={{ width: `${(influenceResult.sucessosAcumulados / influenceResult.sucessosNecessarios) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">
                        {influenceResult.sucessosAcumulados}/{influenceResult.sucessosNecessarios}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {influenceResult.dominou ? (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                    <span className="font-bold text-green-100 text-lg">
                      {targetTerritory.name} estava rebelde e foi dominado!
                    </span>
                  </div>
                ) : isSuccess ? (
                  <div className="space-y-1 text-white">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-300" />
                      <span>Fé reduzida em {influenceResult.reducaoFe}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-300" />
                      <span>Marcadores de pressão: {influenceResult.marcadoresPressao}</span>
                    </div>
                    {influenceResult.ficouPressionado && (
                      <div className="mt-2 p-2 bg-orange-900/50 rounded border border-orange-600">
                        <span className="font-bold text-orange-200">
                          Território pressionado! Produz metade por 1 rodada.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-200">
                    Nenhum efeito aplicado.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="w-full bg-purple-700 hover:bg-purple-600 text-purple-50 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
