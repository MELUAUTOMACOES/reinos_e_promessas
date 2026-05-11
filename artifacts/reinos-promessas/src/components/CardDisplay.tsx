
import type { Card } from "@/types";

interface CardDisplayProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
}

export default function CardDisplay({ card, onClick, disabled }: CardDisplayProps) {
  const rarityColors = {
    comum: "bg-gray-600 border-gray-400",
    incomum: "bg-green-700 border-green-500",
    raro: "bg-blue-700 border-blue-500",
    lendario: "bg-purple-700 border-purple-500",
  };

  const typeIcons = {
    personagem: "👤",
    tatica: "⚔️",
    missao: "📜",
    evento: "⚡",
  };

  return (
    <div
      className={`
        relative w-40 h-56 rounded-lg border-2 p-3 cursor-pointer
        transition-all hover:scale-105 hover:shadow-lg
        ${rarityColors[card.rarity]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex flex-col h-full">
        <div className="text-center mb-2">
          <div className="text-2xl mb-1">{typeIcons[card.type]}</div>
          <h3 className="text-white font-bold text-sm leading-tight">{card.name}</h3>
          <div className="text-xs text-gray-300 capitalize">{card.type}</div>
        </div>

        <div className="flex-1 text-xs text-gray-100 overflow-hidden">
          <p className="line-clamp-4">{card.description}</p>
        </div>

        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="flex justify-between items-center text-xs">
            <span className="text-yellow-300">💰 {card.cost}</span>
            {card.legacyPoints && (
              <span className="text-purple-300">🏆 {card.legacyPoints}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
