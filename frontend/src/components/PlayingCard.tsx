import React from 'react';

export interface CardData {
  id: string;
  name: string;
  number: string;
  meaning: string;
  icon: string;
  description: string;
}

interface PlayingCardProps {
  card: CardData;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  index,
  isHovered,
  isSelected,
  onClick,
}) => {
  // Calculate rotation and translation to create a fanned tarot deck arc
  const offsetFromCenter = index - 2;
  const rotateDeg = offsetFromCenter * 8; // -16, -8, 0, 8, 16
  const translateX = offsetFromCenter * 54; // -108, -54, 0, 54, 108
  const translateY = Math.abs(offsetFromCenter) * 8; // Curved arc downward on edges

  // Base transform style
  let transformStyle = `rotate(${rotateDeg}deg) translate(${translateX}px, ${translateY}px)`;

  if (isSelected) {
    // Lift card significantly and scale up when selected
    transformStyle = `rotate(${rotateDeg * 0.4}deg) translate(${translateX * 0.8}px, ${translateY - 70}px) scale(1.1)`;
  } else if (isHovered) {
    // Lift card slightly on hover
    transformStyle = `rotate(${rotateDeg * 0.7}deg) translate(${translateX * 0.9}px, ${translateY - 35}px) scale(1.05)`;
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation(); // Stop click propagation to prevent table felt trigger
        onClick();
      }}
      data-card-id={card.id}
      style={{
        transform: transformStyle,
        transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      className={`absolute w-36 h-56 rounded-2xl cursor-pointer select-none bg-gradient-to-b from-slate-950 to-slate-900 border flex flex-col justify-between p-4 shadow-2xl ${
        isSelected
          ? 'border-amber-400 shadow-neon-emerald z-30'
          : isHovered
            ? 'border-cyber-accent shadow-neon-cyan z-20'
            : 'border-amber-500/10 hover:border-amber-500/30 z-10'
      }`}
    >
      {/* Decorative inner border for tarot aesthetics */}
      <div className="absolute inset-1 rounded-[14px] border border-amber-500/5 pointer-events-none" />

      {/* Top Roman Numeral & Card Name */}
      <div className="flex flex-col items-center justify-center w-full leading-none z-10">
        <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500/60 uppercase">
          {card.number}
        </span>
        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider text-center max-w-[100px] truncate">
          {card.name}
        </span>
      </div>

      {/* Center Archetype Graphic / Icon */}
      <div className="text-4xl self-center select-none filter drop-shadow-md z-10 animate-pulse-slow">
        {card.icon}
      </div>

      {/* Bottom Mirror Number & Card Name */}
      <div className="flex flex-col items-center justify-center w-full leading-none rotate-180 z-10">
        <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500/60 uppercase">
          {card.number}
        </span>
        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider text-center max-w-[100px] truncate">
          {card.name}
        </span>
      </div>
    </div>
  );
};
export default PlayingCard;
