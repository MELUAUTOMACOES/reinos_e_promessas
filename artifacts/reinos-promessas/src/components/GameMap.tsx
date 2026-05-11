
import { useMemo } from "react";
import type { Territory, Player } from "@/types";
import { getFaithInfo } from "@/game-core/faith";

interface GameMapProps {
  territories: Territory[];
  players: Player[];
  selectedId: string | null;
  currentPlayerId: string;
  /** If set, we're in move-target mode — this territory is the source */
  moveSourceId?: string | null;
  /** Territories that are valid move targets in move-target mode */
  validMoveTargets?: Set<string>;
  onSelect: (id: string) => void;
}

const RADIUS: Record<string, number> = {
  capital: 20,
  estrategico: 16,
  sagrado: 16,
  comum: 13,
};

const VIEW_BOX = "130 70 670 540";

export default function GameMap({
  territories,
  players,
  selectedId,
  currentPlayerId,
  moveSourceId,
  validMoveTargets,
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

  const inMoveMode = moveSourceId != null;
  const selectedTerritory = selectedId ? territoryMap.get(selectedId) : null;
  const connectedIds = new Set(selectedTerritory?.connections ?? []);

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
      <rect x="130" y="70" width="670" height="540" fill="#1c1917" rx="8" />

      {/* Region labels */}
      <text x="148" y="108" fill="#44403c" fontSize="9" fontWeight="600" letterSpacing="2">MESOPOTÂMIA</text>
      <text x="148" y="610" fill="#44403c" fontSize="9" fontWeight="600" letterSpacing="2">EGITO</text>

      {/* ── Connection lines ─────────────────────────────────────────────── */}
      {connectionPairs.map(([a, b]) => {
        const isMoveSourceLine =
          inMoveMode &&
          ((a.id === moveSourceId && validMoveTargets?.has(b.id)) ||
            (b.id === moveSourceId && validMoveTargets?.has(a.id)));
        const isSelectionHighlight =
          !inMoveMode &&
          ((a.id === selectedId && connectedIds.has(b.id)) ||
            (b.id === selectedId && connectedIds.has(a.id)));

        const isHighlighted = isMoveSourceLine || isSelectionHighlight;
        const isDimmed =
          inMoveMode &&
          !isMoveSourceLine &&
          a.id !== moveSourceId &&
          b.id !== moveSourceId;

        return (
          <line
            key={`${a.id}-${b.id}`}
            x1={a.position.x}
            y1={a.position.y}
            x2={b.position.x}
            y2={b.position.y}
            stroke={isMoveSourceLine ? "#22c55e" : isSelectionHighlight ? "#d97706" : "#3d3834"}
            strokeWidth={isHighlighted ? 2.5 : 1}
            strokeDasharray={isHighlighted ? "none" : "4 3"}
            opacity={isDimmed ? 0.2 : 1}
          />
        );
      })}

      {/* ── Territories ─────────────────────────────────────────────────── */}
      {territories.map((t) => {
        const owner = t.donoAtual ? playerMap.get(t.donoAtual) : null;
        const faithInfo = getFaithInfo(t.feAtual);
        const r = RADIUS[t.type] ?? 13;

        const isSelected = t.id === selectedId;
        const isMoveSource = t.id === moveSourceId;
        const isValidMoveTarget = inMoveMode && validMoveTargets?.has(t.id);
        const isConnected = !inMoveMode && connectedIds.has(t.id);

        // Dimming logic
        let opacity = 1;
        if (inMoveMode) {
          if (!isMoveSource && !isValidMoveTarget) opacity = 0.35;
        } else if (selectedId) {
          if (!isSelected && !isConnected) opacity = 0.45;
        }

        // Stroke
        let strokeColor = t.type === "capital" ? "#78716c" : t.type === "sagrado" ? "#a78bfa" : "#57534e";
        let strokeWidth = t.type === "capital" ? 2 : 1;

        if (isMoveSource) { strokeColor = "#22c55e"; strokeWidth = 3; }
        else if (isValidMoveTarget) { strokeColor = "#22c55e"; strokeWidth = 2.5; }
        else if (isSelected) { strokeColor = "#fbbf24"; strokeWidth = 3; }
        else if (isConnected) { strokeColor = "#d97706"; strokeWidth = 2; }

        const fillColor = t.bloqueado
          ? "#1c1917"
          : owner
          ? owner.color + "cc"
          : "#44403c";

        const isClickable = inMoveMode ? isValidMoveTarget || isMoveSource : true;

        return (
          <g
            key={t.id}
            transform={`translate(${t.position.x}, ${t.position.y})`}
            onClick={() => isClickable && onSelect(t.id)}
            style={{ cursor: isClickable ? "pointer" : "default" }}
            opacity={opacity}
          >
            {/* Valid move target pulse ring */}
            {isValidMoveTarget && (
              <circle r={r + 6} fill="none" stroke="#22c55e" strokeWidth={1} opacity={0.4} />
            )}

            {/* Faith ring */}
            {owner && !t.bloqueado && (
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
            {t.bloqueado && (
              <>
                <circle r={r} fill="#0c0a09" opacity={0.75} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.85} fill="#57534e">🔒</text>
              </>
            )}

            {/* Troop count */}
            {!t.bloqueado && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={r > 15 ? 10 : 8}
                fontWeight="bold"
                fill={owner ? "#fff" : "#a8a29e"}
              >
                {t.tropasAtuais}
              </text>
            )}

            {/* Name label */}
            <text
              y={r + 9}
              textAnchor="middle"
              fontSize={9}
              fill={isSelected || isMoveSource ? "#fbbf24" : isValidMoveTarget ? "#4ade80" : "#d6d3d1"}
              fontWeight={isSelected || isMoveSource || isValidMoveTarget ? "bold" : "normal"}
            >
              {t.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
