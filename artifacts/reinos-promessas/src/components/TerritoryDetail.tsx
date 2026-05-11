
import type { Territory, Player } from "@/types";
import { TROOP_LIMITS } from "@/types";
import { getFaithInfo, getTerritoryFaithStatus } from "@/game-core/faith";

interface TerritoryDetailProps {
  territory: Territory;
  players: Player[];
  currentPlayerId: string;
}

const TYPE_LABELS: Record<string, string> = {
  capital: "Capital",
  estrategico: "Estratégico",
  sagrado: "Sagrado",
  comum: "Comum",
};

const STATE_LABELS: Record<string, string> = {
  neutro: "Neutro",
  controlado: "Controlado",
  instavel: "Instável",
  pressionado: "Pressionado",
  rebelde: "Rebelde",
};

export default function TerritoryDetail({
  territory: t,
  players,
  currentPlayerId,
}: TerritoryDetailProps) {
  const owner = t.donoAtual ? players.find((p) => p.id === t.donoAtual) : null;
  const faithInfo = getFaithInfo(t.feAtual);
  const faithLevel = getTerritoryFaithStatus(t.feAtual);
  const troopMax = TROOP_LIMITS[t.type];
  const troopPct = Math.min(1, t.tropasAtuais / troopMax);
  const faithPct = t.feAtual / 100;
  const isMine = t.donoAtual === currentPlayerId;

  return (
    <div className="flex flex-col gap-3 p-4 text-sm">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-amber-100 font-bold text-base leading-tight">{t.name}</h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium mt-0.5"
            style={{
              backgroundColor: faithInfo.color + "22",
              color: faithInfo.color,
            }}
          >
            {faithInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-amber-600 text-xs">{TYPE_LABELS[t.type]}</span>
          <span className="text-amber-800 text-xs">·</span>
          <span className="text-amber-600 text-xs">{STATE_LABELS[t.estado]}</span>
          {t.bloqueado && (
            <>
              <span className="text-amber-800 text-xs">·</span>
              <span className="text-amber-700 text-xs">🔒 Bloqueado</span>
            </>
          )}
        </div>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2">
        {owner ? (
          <>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: owner.color }}
            />
            <span className="text-amber-200 text-xs">
              {owner.name}
              {isMine && (
                <span className="text-amber-500 ml-1">(seu)</span>
              )}
            </span>
          </>
        ) : (
          <span className="text-amber-700 text-xs">Território neutro</span>
        )}
      </div>

      {/* Troops */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-amber-500">Tropas</span>
          <span className="text-amber-300 font-semibold">
            {t.tropasAtuais} / {troopMax}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-amber-900/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${troopPct * 100}%`,
              backgroundColor: owner?.color ?? "#78716c",
            }}
          />
        </div>
      </div>

      {/* Faith */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-amber-500">Fé</span>
          <span className="font-semibold" style={{ color: faithInfo.color }}>
            {t.feAtual} / 100
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-amber-900/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${faithPct * 100}%`,
              backgroundColor: faithInfo.color,
            }}
          />
        </div>
        <p className="text-amber-700/80 text-xs mt-1">{faithInfo.description}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-900/20 rounded-lg p-2 text-center">
          <div className="text-amber-200 font-bold">{t.defesaNatural}</div>
          <div className="text-amber-700 text-xs">Defesa</div>
        </div>
        <div className="bg-amber-900/20 rounded-lg p-2 text-center">
          <div className="text-amber-200 font-bold">{faithInfo.defenseBonus >= 0 ? "+" : ""}{faithInfo.defenseBonus}</div>
          <div className="text-amber-700 text-xs">Bônus Fé</div>
        </div>
      </div>

      {/* Production */}
      <div>
        <div className="text-amber-500 text-xs mb-1.5">Produção por turno</div>
        <div className="flex flex-wrap gap-2">
          {t.producao.provisao > 0 && (
            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
              🌾 +{t.producao.provisao}
            </span>
          )}
          {t.producao.ouro > 0 && (
            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded">
              🪙 +{t.producao.ouro}
            </span>
          )}
          {t.producao.influencia > 0 && (
            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
              👁 +{t.producao.influencia}
            </span>
          )}
          {(t.producao.militar ?? 0) > 0 && (
            <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">
              ⚔ +{t.producao.militar}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-amber-600/70 text-xs leading-relaxed border-t border-amber-800/30 pt-3">
        {t.descricao}
      </p>

      {/* Strengths */}
      <div className="grid grid-cols-1 gap-1.5">
        <div className="text-xs">
          <span className="text-green-500 mr-1">✦</span>
          <span className="text-amber-400/80">{t.pontoForte}</span>
        </div>
        <div className="text-xs">
          <span className="text-red-500 mr-1">✦</span>
          <span className="text-amber-400/80">{t.pontoFraco}</span>
        </div>
      </div>
    </div>
  );
}
