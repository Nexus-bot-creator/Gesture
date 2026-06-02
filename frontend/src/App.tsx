import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import VirtualCursor from './components/VirtualCursor';
import WebcamPiP from './components/WebcamPiP';
import { Sparkles, Eye } from 'lucide-react';

export const App: React.FC = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);

  const handleCursorMove = (x: number, y: number) => {
    setCursorPos({ x, y });
  };

  const handlePinchState = (pinching: boolean) => {
    setIsPinching(pinching);
  };

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col justify-between overflow-hidden text-slate-100 font-sans relative">
      
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-cyber-dark)_0%,_var(--color-cyber-black)_100%)] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:32px_32px] z-0 pointer-events-none" />

      {/* Header Title bar */}
      <header className="z-10 py-6 px-8 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyber-accent to-cyber-purple flex items-center justify-center shadow-neon-cyan animate-pulse">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyber-accent bg-clip-text text-transparent">
                GESTURE
              </span>
              <span className="text-[9px] block text-cyber-accent font-bold -mt-1 tracking-widest font-mono">
                CARD ARENA
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-white/5 px-3 py-1 rounded-lg text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-ping" />
            <span className="text-slate-400">INPUT SOURCE: </span>
            <span className="text-cyber-accent font-bold">WEBCAM PIP</span>
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10">
        <div className="text-center max-w-xl mb-6 space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-cyber-accent/15 to-cyber-purple/15 border border-cyber-accent/25 px-3 py-1 rounded-full text-[10px] font-semibold text-cyber-accent tracking-wider uppercase font-mono mx-auto">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>FastAPI WebSocket Inference Active</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Touchless Card Selection
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Move your index finger to control the crosshair. Tap your index and thumb together to select a card.
          </p>
        </div>

        {/* The Card Game Felt Board */}
        <GameBoard
          cursorX={cursorPos.x}
          cursorY={cursorPos.y}
          isPinching={isPinching}
        />
      </main>

      {/* Footer bar */}
      <footer className="z-10 py-5 px-8 border-t border-white/5 bg-slate-950/20 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 GESTURE CARD ARENA. ALL RIGHTS RESERVED.</span>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-cyber-accent transition-colors">Docs</a>
          <a href="#" className="hover:text-cyber-accent transition-colors">GitHub</a>
        </div>
      </footer>

      {/* 1. Mirrored Webcam Tracking Picture-in-Picture */}
      <WebcamPiP
        onCursorMove={handleCursorMove}
        onPinch={handlePinchState}
      />

      {/* 2. Custom Neon Cursor Follower */}
      {cursorPos.x !== 0 && cursorPos.y !== 0 && (
        <VirtualCursor
          x={cursorPos.x}
          y={cursorPos.y}
          isPinching={isPinching}
        />
      )}

    </div>
  );
};
export default App;
