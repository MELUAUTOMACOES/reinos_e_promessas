import { useMemo } from "react";
import type { Territory, Player } from "@/types";
import { getFaithInfo } from "@/game-core/faith";

interface GameMapProps {
  territories: Territory[];
  players: Player[];
  selectedId: string | null;
  currentPlayerId: string;
  moveSourceId?: string | null;
  validMoveTargets?: Set<string>;
  onSelect: (id: string) => void;
}

const RADIUS: Record<string, number> = {
  capital: 24,
  estrategico: 19,
  sagrado: 19,
  comum: 16,
};

const VIEW_BOX = "115 55 705 580";

const POSITION_OFFSETS: Record<string, { x: number; y: number }> = {
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

function getMapPosition(territory: Territory) {
  const offset = POSITION_OFFSETS[territory.id] ?? { x: 0, y: 0 };
  return {
    x: territory.position.x + offset.x,
    y: territory.position.y + offset.y,
  };
}

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
    [players],
  );

  const territoryMap = useMemo(
    () => new Map(territories.map((t) => [t.id, t])),
    [territories],
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
      className="w-full h-full drop-shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
      preserveAspectRatio="xMidYMid meet"
      style={{ fontFamily: "inherit" }}
    >
      <defs>
        <radialGradient id="mapGlow" cx="52%" cy="42%" r="64%">
          <stop offset="0%" stopColor="#5f3d1c" stopOpacity="0.5" />
          <stop offset="48%" stopColor="#26170c" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#090705" stopOpacity="1" />
        </radialGradient>
        <linearGradient id="boardEdge" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#78350f" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.18" />
        </linearGradient>
        <filter id="territoryShadow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.65" />
        </filter>
        <filter id="labelPlateShadow" x="-20%" y="-40%" width="140%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.72" />
        </filter>
        <pattern id="sandTexture" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M2 11 C12 6 20 18 32 10 M7 31 C16 25 27 38 39 29" fill="none" stroke="#f59e0b" strokeOpacity="0.055" strokeWidth="1" />
          <circle cx="9" cy="8" r="1" fill="#fef3c7" opacity="0.06" />
          <circle cx="31" cy="24" r="1.2" fill="#fef3c7" opacity="0.045" />
        </pattern>
      </defs>

      <rect x="112" y="52" width="721" height="586" fill="url(#mapGlow)" rx="22" />
      <rect x="112" y="52" width="721" height="586" fill="url(#sandTexture)" rx="22" />
      <rect x="116" y="56" width="713" height="578" fill="none" stroke="url(#boardEdge)" strokeWidth="2" rx="19" />
      <path
        d="M155 180 C245 115 342 130 432 98 C552 56 677 97 778 155 L781 570 C684 603 578 576 473 602 C352 631 244 585 149 609 Z"
        fill="#2f2414"
        opacity="0.32"
      />
      <path
        d="M128 118 C228 143 293 107 375 145 C468 188 570 120 680 158 C746 181 791 240 812 308"
        fill="none"
        stroke="#f59e0b"
        strokeOpacity="0.1"
        strokeWidth="18"
        strokeLinecap="round"
      />

      <text x="138" y="96" fill="#f59e0b" opacity="0.32" fontSize="11" fontWeight="800" letterSpacing="3">MESOPOTAMIA</text>
      <text x="139" y="618" fill="#f59e0b" opacity="0.26" fontSize="11" fontWeight="800" letterSpacing="3">EGITO</text>
      <text x="636" y="103" fill="#fef3c7" opacity="0.14" fontSize="10" fontWeight="700" letterSpacing="2">DESERTOS DO ORIENTE</text>

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
          <g key={`${a.id}-${b.id}`} opacity={isDimmed ? 0.18 : 1}>
            <line
              x1={getMapPosition(a).x}
              y1={getMapPosition(a).y}
              x2={getMapPosition(b).x}
              y2={getMapPosition(b).y}
              stroke="#0c0a09"
              strokeWidth={isHighlighted ? 7 : 5}
              strokeLinecap="round"
              opacity="0.42"
            />
            <line
              x1={getMapPosition(a).x}
              y1={getMapPosition(a).y}
              x2={getMapPosition(b).x}
              y2={getMapPosition(b).y}
              stroke={isMoveSourceLine ? "#4ade80" : isSelectionHighlight ? "#f59e0b" : "#a16207"}
              strokeWidth={isHighlighted ? 3 : 1.6}
              strokeDasharray={isHighlighted ? "none" : "6 7"}
              strokeLinecap="round"
              opacity={isHighlighted ? 0.95 : 0.42}
            />
          </g>
        );
      })}

      {territories.map((t) => {
        const owner = t.donoAtual ? playerMap.get(t.donoAtual) : null;
        const faithInfo = getFaithInfo(t.feAtual);
        const r = RADIUS[t.type] ?? 16;

        const isSelected = t.id === selectedId;
        const isMoveSource = t.id === moveSourceId;
        const isValidMoveTarget = inMoveMode && validMoveTargets?.has(t.id);
        const isConnected = !inMoveMode && connectedIds.has(t.id);

        let opacity = 1;
        if (inMoveMode) {
          if (!isMoveSource && !isValidMoveTarget) opacity = 0.35;
        } else if (selectedId) {
          if (!isSelected && !isConnected) opacity = 0.5;
        }

        let strokeColor =
          t.type === "capital"
            ? "#f59e0b"
            : t.type === "sagrado"
              ? "#c4b5fd"
              : t.type === "estrategico"
                ? "#fbbf24"
                : "#a8a29e";
        let strokeWidth = t.type === "capital" ? 3 : t.type === "comum" ? 1.5 : 2;

        if (isMoveSource) {
          strokeColor = "#22c55e";
          strokeWidth = 3.5;
        } else if (isValidMoveTarget) {
          strokeColor = "#4ade80";
          strokeWidth = 3;
        } else if (isSelected) {
          strokeColor = "#fbbf24";
          strokeWidth = 3.5;
        } else if (isConnected) {
          strokeColor = "#d97706";
          strokeWidth = 2.5;
        }

        const fillColor = t.bloqueado && !owner
          ? "#1c1917"
          : owner
            ? owner.color
            : t.type === "sagrado"
              ? "#7c3aed"
              : t.type === "estrategico"
                ? "#b45309"
                : "#71614b";

        const isClickable = inMoveMode ? isValidMoveTarget || isMoveSource : true;
        const labelWidth = Math.max(46, t.name.length * 5.8);
        const position = getMapPosition(t);

        return (
          <g
            key={t.id}
            data-territory-node="true"
            transform={`translate(${position.x}, ${position.y})`}
            onClick={() => isClickable && onSelect(t.id)}
            style={{ cursor: isClickable ? "pointer" : "default" }}
            opacity={opacity}
          >
            {isValidMoveTarget && (
              <circle r={r + 9} fill="none" stroke="#4ade80" strokeWidth={2} opacity={0.55} />
            )}

            {!(t.bloqueado && !owner) && (
              <circle
                r={r + 5}
                fill="none"
                stroke={faithInfo.color}
                strokeWidth={2}
                opacity={owner ? 0.62 : 0.38}
              />
            )}

            {(t.type === "capital" || t.type === "sagrado") && !(t.bloqueado && !owner) && (
              <circle
                r={r + 11}
                fill="none"
                stroke={t.type === "capital" ? "#f59e0b" : "#a78bfa"}
                strokeWidth={1.4}
                strokeDasharray={t.type === "sagrado" ? "3 5" : "none"}
                opacity={isSelected ? 0.9 : 0.42}
              />
            )}

            <circle
              r={r}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={t.type === "sagrado" ? "4 2" : "none"}
              filter="url(#territoryShadow)"
            />
            <circle r={r - 4} fill="#ffffff" opacity={owner ? 0.12 : 0.07} />

            {t.bloqueado && !owner && (
              <>
                <circle r={r} fill="#0c0a09" opacity={0.75} />
                <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.85} fill="#57534e">X</text>
              </>
            )}

            {!(t.bloqueado && !owner) && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={r > 20 ? 13 : r > 16 ? 11 : 10}
                fontWeight="900"
                fill={owner ? "#fff" : "#f8fafc"}
                stroke="#0c0a09"
                strokeWidth="2.5"
                paintOrder="stroke"
              >
                {t.tropasAtuais}
              </text>
            )}

            <rect
              x={-(labelWidth / 2)}
              y={r + 9}
              width={labelWidth}
              height="15"
              rx="7"
              fill="#090705"
              opacity={isSelected || isMoveSource || isValidMoveTarget ? 0.78 : 0.5}
              filter="url(#labelPlateShadow)"
            />
            <text
              y={r + 20}
              textAnchor="middle"
              fontSize={10}
              fill={isSelected || isMoveSource ? "#fbbf24" : isValidMoveTarget ? "#4ade80" : "#d6d3d1"}
              fontWeight={isSelected || isMoveSource || isValidMoveTarget ? "900" : "700"}
            >
              {t.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
