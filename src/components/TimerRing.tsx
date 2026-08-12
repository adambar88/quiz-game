import React, { useEffect, useState } from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { soundEngine } from '../services/soundEngine.ts';

export const TimerRing: React.FC = () => {
  const { gameState, timeLimitMs, questionStartTime, selectedOptionIndex } = useQuizStore();
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMs);

  useEffect(() => {
    if (gameState !== 'ACTIVE' || selectedOptionIndex !== null) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeRemaining(remaining);

      // Play tick sound when less than 4 seconds remaining
      if (remaining <= 4000 && remaining > 0 && remaining % 1000 < 100) {
        soundEngine.playTimerTick();
      }

      if (remaining <= 0) {
        clearInterval(interval);
        quizStore.handleTimeout();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, questionStartTime, timeLimitMs, selectedOptionIndex]);

  const ratio = Math.max(0, Math.min(1, timeRemaining / timeLimitMs));
  const seconds = (timeRemaining / 1000).toFixed(1);

  // Dynamic color warning: Green -> Yellow -> Red
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';
  if (ratio < 0.25) {
    barColor = 'bg-red-500 animate-pulse';
    textColor = 'text-red-400 font-bold animate-pulse';
  } else if (ratio < 0.5) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[var(--text-dim)]">TIMER</span>
        <span className={textColor}>{seconds}s</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-100 ease-linear ${barColor}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
};
