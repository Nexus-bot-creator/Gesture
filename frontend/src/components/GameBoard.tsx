import React, { useState, useEffect } from 'react';
import PlayingCard from './PlayingCard';
import type { CardData } from './PlayingCard';
import { Sparkles, HelpCircle, BookOpen } from 'lucide-react';

interface GameBoardProps {
  cursorX: number;
  cursorY: number;
  isPinching: boolean;
}

const TAROT_CARDS: CardData[] = [
  { 
    id: 'fool', 
    name: 'The Fool', 
    number: '0', 
    meaning: 'New beginnings, optimism, adventure, leap of faith.', 
    icon: '🎒', 
    description: 'The Fool represents the start of a journey. It signals unlimited potential, spontaneous actions, and a belief that everything will work out. Keep your mind open, let go of worries, and take the leap!' 
  },
  { 
    id: 'magician', 
    name: 'The Magician', 
    number: 'I', 
    meaning: 'Manifestation, willpower, creation, desire, resourcefulness.', 
    icon: '🪄', 
    description: 'The Magician represents resourcefulness, intellect, and the power to translate thoughts into physical achievements. You have the tools needed to manifest your dreams; it is time to focus your willpower.' 
  },
  { 
    id: 'high-priestess', 
    name: 'The High Priestess', 
    number: 'II', 
    meaning: 'Intuition, sacred knowledge, subconscious mind, divine feminine.', 
    icon: '🌙', 
    description: 'The High Priestess is the guardian of the subconscious. She signals that it is time to trust your intuition, look inward, and seek hidden knowledge. Answers will emerge from within if you stay still.' 
  },
  { 
    id: 'empress', 
    name: 'The Empress', 
    number: 'III', 
    meaning: 'Abundance, creativity, nature, nurturing, beauty, domestic comfort.', 
    icon: '👑', 
    description: 'The Empress represents fertility, domestic comfort, and connections with the natural world. She represents a time for growth, nurturing projects, and enjoying sensory pleasures. Connect with your feminine energy.' 
  },
  { 
    id: 'emperor', 
    name: 'The Emperor', 
    number: 'IV', 
    meaning: 'Authority, structure, solid foundation, logical control, discipline.', 
    icon: '🏛️', 
    description: 'The Emperor represents structural security, administrative authority, and logical order. He stands for building long-lasting systems and enforcing discipline. Take charge of your circumstances.' 
  },
];

export const GameBoard: React.FC<GameBoardProps> = ({ cursorX, cursorY, isPinching }) => {
  const cards = TAROT_CARDS;
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastPinchState, setLastPinchState] = useState(false);
  const [notification, setNotification] = useState<string | null>(
    'Whip out your hand, turn on tracking, and hover over a tarot card.'
  );

  // Find the currently selected card object
  const selectedCard = cards.find(c => c.id === selectedCardId);

  // 1. Detect hovered card using document.elementFromPoint
  useEffect(() => {
    if (cursorX === 0 && cursorY === 0) return;

    const element = document.elementFromPoint(cursorX, cursorY);
    if (element) {
      const cardContainer = element.closest('[data-card-id]');
      if (cardContainer) {
        const cardId = cardContainer.getAttribute('data-card-id');
        setHoveredCardId(cardId);
        return;
      }
    }
    setHoveredCardId(null);
  }, [cursorX, cursorY]);

  // 2. Detect pinch-click triggers
  useEffect(() => {
    // Detect rising edge: transition from false to true (pinch started)
    if (isPinching && !lastPinchState) {
      if (hoveredCardId) {
        setSelectedCardId(hoveredCardId);
        setNotification(`Opened tarot reading for ${cards.find(c => c.id === hoveredCardId)?.name}!`);
      } else {
        // Pinch clicked on empty space / blank space! Close popup and return to normal
        setSelectedCardId(null);
        setNotification('Pinch on empty table. Reset cards and closed popup.');
      }
    }
    setLastPinchState(isPinching);
  }, [isPinching, lastPinchState, hoveredCardId, cards]);

  // Close when clicking directly on any blank space (not a card, and not the popup modal)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore if clicking a card or inside a card
      if (target.closest('[data-card-id]')) return;

      // Ignore if clicking inside the popup content modal
      if (target.closest('.popup-content')) return;

      // Ignore if clicking the webcam tracker container, standard buttons, or video feed
      if (
        target.closest('.webcam-container') || 
        target.closest('button') || 
        target.closest('video') ||
        target.closest('canvas')
      ) {
        return;
      }

      // Otherwise, reset selected card (closes popup and returns cards to normal fanned layout)
      setSelectedCardId(null);
      setNotification('Clicked blank space. Reset cards.');
    };

    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleClosePopup = () => {
    setSelectedCardId(null);
    setNotification('Closed popup. Hover over another card.');
  };

  return (
    <div 
      className="flex flex-col items-center justify-between w-full h-[65vh] relative select-none table-container"
    >
      {/* Tarot Gaming Table HUD Display */}
      <div className="w-full max-w-xl glass p-4 rounded-2xl border border-white/5 text-center flex items-center justify-between shadow-xl mt-4 z-10">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Major Arcana</span>
            <span className="block text-sm font-bold text-slate-200 mt-0.5">
              {selectedCard ? (
                <span className="text-amber-400">
                  {selectedCard.number}. {selectedCard.name}
                </span>
              ) : (
                <span className="text-slate-500 italic">Reading Pending</span>
              )}
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-white/5 hidden sm:block" />

        <div className="flex items-center space-x-2 text-xs text-slate-400 max-w-xs text-left">
          <Sparkles className="w-4.5 h-4.5 text-cyber-accent flex-shrink-0 animate-pulse" />
          <span className="font-mono text-[10px] text-slate-400 leading-normal">
            {notification}
          </span>
        </div>
      </div>

      {/* Main Table Fan Area (Felt Background) */}
      <div 
        className="relative w-full flex items-center justify-center h-80 bg-gradient-to-t from-slate-950/20 to-transparent rounded-full border-b border-white/2 max-w-3xl table-felt"
      >
        {/* Table Felt Glow */}
        <div className="absolute bottom-0 w-80 h-32 bg-amber-500/3 rounded-full blur-2xl pointer-events-none" />

        {/* Fanned Cards Hand */}
        <div className="relative w-36 h-56 mt-6 pointer-events-auto">
          {cards.map((card, idx) => (
            <PlayingCard
              key={card.id}
              card={card}
              index={idx}
              isHovered={hoveredCardId === card.id}
              isSelected={selectedCardId === card.id}
              onClick={() => setSelectedCardId(card.id)}
            />
          ))}
        </div>
      </div>

      {/* Help Panel */}
      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 border-t border-white/5 pt-4 w-full justify-center z-10">
        <HelpCircle className="w-4 h-4 text-slate-500" />
        <span>Pinch to open card details. Click / Pinch in empty space to close and reset.</span>
      </div>

      {/* 3. Reading Detail Popup Overlay Modal */}
      {selectedCard && (
        <div 
          onClick={handleClosePopup}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 fade-in cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()} // Stop closing when clicking inside
            className="popup-content bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/25 p-8 rounded-3xl max-w-md w-full shadow-2xl relative select-text cursor-default flex flex-col space-y-6"
          >
            {/* Close Cross button */}
            <button 
              onClick={handleClosePopup}
              className="absolute top-4 right-4 text-slate-500 hover:text-amber-400 font-mono text-sm p-1 px-2 border border-white/5 rounded-lg bg-slate-950/60 hover:border-amber-500/25 transition-all"
            >
              ✕
            </button>

            {/* Header: Roman Numeral & Title */}
            <div className="text-center border-b border-white/5 pb-4">
              <span className="text-xs font-mono font-extrabold text-amber-500/80 tracking-widest block uppercase">
                Major Arcana - Card {selectedCard.number}
              </span>
              <h2 className="text-3xl font-black text-slate-200 mt-1 uppercase tracking-wider font-sans bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {selectedCard.name}
              </h2>
            </div>

            {/* Illustration Emoji */}
            <div className="w-24 h-24 rounded-full bg-slate-950 border border-amber-500/10 flex items-center justify-center text-5xl mx-auto shadow-inner shadow-amber-500/5">
              {selectedCard.icon}
            </div>

            {/* Meaning Panel */}
            <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/15">
              <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                Upright Meaning
              </span>
              <p className="text-sm font-semibold text-amber-400 mt-1">
                {selectedCard.meaning}
              </p>
            </div>

            {/* Description Text */}
            <div className="space-y-1.5 leading-relaxed">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                Interpretation
              </span>
              <p className="text-xs text-slate-400 leading-normal">
                {selectedCard.description}
              </p>
            </div>

            {/* Action close button */}
            <button
              onClick={handleClosePopup}
              className="w-full bg-gradient-to-r from-amber-500/80 to-amber-600/80 hover:scale-[1.01] text-slate-950 font-extrabold py-3 rounded-xl text-xs transition-all shadow-md shadow-amber-500/10"
            >
              Close Tarot Reading
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
export default GameBoard;
