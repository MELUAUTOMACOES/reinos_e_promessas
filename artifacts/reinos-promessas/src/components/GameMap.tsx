
import { useMemo } from "react";
import type { Territory, Player } from "@/types";
import { getFaithInfo } from "@/game-core/faith";

interface GameMapProps {
  territories: Territory[];
  players: Player[];
  selectedId: string | null;
  currentPlayerId: string;
  onSelect: (id: string) => void;
}

// Visual radius by territory type
const RADIUS: Record<string, number> = {
  capital: 20,
  estrategico: 16,
  sagrado: 16,
  comum: 13,
};

// Map viewport (matches territory position coordinates)
const VIEW_BOX = "130 70 670 540";

export default function GameMap({
  territories,
  players,
  selectedId,
  currentPlayerId,
  onSelect,
}: GameMapProps) {
  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const territoryMap = useMemo(
    () => new Map(territories.map((t) => [t.id, t])),
    [territories]
  );

  const selectedTerritory = selectedId ? territoryMap.get(selectedId) : null;
  const connectedIds = new Set(selectedTerritory?.connections ?? []);

  // Build unique connection pairs (avoid duplicating A→B and B→A)
  const connectionPairs = useMemo(() => {
    const seen = new Set<string>();
    const pairs: [Territory, Territory][] = [];
    for (const t of territories) {
      for (const connId of t.connections) {
        const key = [t.id, connId].sort().join(":");
        if (!seen.has(key)) {
          seen.add(key);
          const conn = territoryMap.get(connId);
          if (conn) pairs.push([t, conn]);
        }
      }
    }
    return pairs;
  }, [territories, territoryMap]);

  return (
    <svg
      viewBox={VIEW_BOX}
      className="w-full h-full"
      style={{ fontFamily: "inherit" }}
    >
      {/* ── Background ──────────────────────────────────────────────────────── */}
      <rect x="130" y="70" width="670" height="540" fill="#1c1917" rx="8" />

      {/* ── Region shading (subtle) ──────────────────────────────────────────── */}
      <text x="148" y="108" fill="#44403c" fontSize="10" fontWeight="600" letterSpacing="2">
        MESOPOTÂMIA
      </text>
      <text x="148" y="630" fill="#44403c" fontSize="10" fontWeight="600" letterSpacing="2">
        EGITO
      </text>

      {/* ── Connections ─────────────────────────────────────────────────────── */}
      {connectionPairs.map(([a, b]) => {
        const aSelected = a.id === selectedId || b.id === selectedId;
        const isHighlighted =
          (a.id === selectedId && connectedIds.has(b.id)) ||
          (b.id === selectedId && connectedIds.has(a.id));
        return (
          <line
            key={`${a.id}-${b.id}`}
            x1={a.position.x}
            y1={a.position.y}
            x2={b.position.x}
            y2={b.position.y}
            stroke={isHighlighted ? "#d97706" : "#3d3834"}
            strokeWidth={isHighlighted ? 2 : 1}
            strokeDasharray={isHighlighted ? "none" : "4 3"}
            opacity={aSelected && !isHighlighted ? 0.3 : 1}
          />
        );
      })}

      {/* ── Territories ─────────────────────────────────────────────────────── */}
      {territories.map((t) => {
        const owner = t.donoAtual ? playerMap.get(t.donoAtual) : null;
        const faithInfo = getFaithInfo(t.feAtual);
        const r = RADIUS[t.type] ?? 13;
        const isSelected = t.id === selectedId;
        const isConnected = connectedIds.has(t.id);
        const isOwned = t.donoAtual !== null;
        const isBlocked = t.bloqueado;

        // Fill color
        const fillColor = isBlocked
          ? "#1c1917"
          : owner
          ? owner.color + "cc"
          : "#44403c";

        // Stroke
        const strokeColor = isSelected
          ? "#fbbf24"
          : isConnected
          ? "#d97706"
          : t.type === "capital"
          ? "#78716c"
          : t.type === "sagrado"
          ? "#a78bfa"
          : "#57534e";

        const strokeWidth = isSelected ? 3 : isConnected ? 2 : t.type === "capital" ? 2 : 1;

        // Dimming: if something is selected, dim unrelated territories
        const opacity =
          selectedId && !isSelected && !isConnected ? 0.45 : 1;

        return (
          <g
            key={t.id}
            transform={`translate(${t.position.x}, ${t.position.y})`}
            onClick={() => onSelect(t.id)}
            style={{ cursor: "pointer" }}
            opacity={opacity}
          >
            {/* Outer faith ring (colored thin ring) */}
            {isOwned && !isBlocked && (
              <circle
                r={r + 4}
                fill="none"
                stroke={faithInfo.color}
                strokeWidth={1.5}
                opacity={0.5}
              />
            )}

            {/* Main circle */}
            <circle
              r={r}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={t.type === "sagrado" ? "4 2" : "none"}
            />

            {/* Blocked overlay */}
            {isBlocked && (
              <>
                <circle r={r} fill="#0c0a09" opacity={0.7} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={r * 0.9}
                  fill="#57534e"
                >
                  🔒
                </text>
              </>
            )}

            {/* Troop count */}
            {!isBlocked && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={r > 15 ? 10 : 8}
                fontWeight="bold"
                fill={isOwned ? "#fff" : "#a8a29e"}
              >
                {t.tropasAtuais}
              </text>
            )}

            {/* Territory name label */}
            <text
              y={r + 9}
              textAnchor="middle"
              fontSize={9}
              fill={isSelected ? "#fbbf24" : "#d6d3d1"}
              fontWeight={isSelected ? "bold" : "normal"}
            >
              {t.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
