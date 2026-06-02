import React from 'react';
import { Target } from 'lucide-react';

interface VirtualCursorProps {
  x: number;
  y: number;
  isPinching: boolean;
}

export const VirtualCursor: React.FC<VirtualCursorProps> = ({ x, y, isPinching }) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.1s ease, height 0.1s ease, background-color 0.1s ease',
        pointerEvents: 'none', // Critical so cursor doesn't block elementFromPoint checks!
      }}
      className={`z-50 rounded-full border-2 flex items-center justify-center pointer-events-none ${
        isPinching
          ? 'w-6 h-6 border-cyber-emerald bg-cyber-emerald/20 shadow-neon-emerald'
          : 'w-10 h-10 border-cyber-accent bg-cyber-accent/10 shadow-neon-cyan'
      }`}
    >
      {/* Center Target Point */}
      <div className={`rounded-full transition-all duration-100 ${
        isPinching 
          ? 'w-1.5 h-1.5 bg-cyber-emerald' 
          : 'w-2 h-2 bg-cyber-accent'
      }`} />
      
      {/* Crosshair reticle ticks */}
      {!isPinching && (
        <Target className="absolute w-6 h-6 text-cyber-accent/40 animate-spin" style={{ animationDuration: '6s' }} />
      )}
    </div>
  );
};
export default VirtualCursor;
