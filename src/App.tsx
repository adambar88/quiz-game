import React, { useEffect } from 'react';
import { useQuizStore } from './state/useQuizStore.ts';
import { storageService } from './services/storageService.ts';
import { Header } from './components/Header.tsx';
import { ModeSelector } from './components/ModeSelector.tsx';
import { QuizArena } from './components/QuizArena.tsx';
import { GameOverSummary } from './components/GameOverSummary.tsx';
import { ReviewOverlay } from './components/ReviewOverlay.tsx';
import { AIConfigModal } from './components/AIConfigModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';

export function App() {
  const { gameState } = useQuizStore();

  // Sync theme with system / barczynski-theme
  useEffect(() => {
    const currentTheme = storageService.getTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const stored = storageService.getTheme();
        const s = document.createElement('style');
        s.textContent = '*,*::before,*::after{transition:none!important}';
        document.head.appendChild(s);
        document.documentElement.setAttribute('data-theme', stored);
        requestAnimationFrame(() => document.head.removeChild(s));
      }
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-between">
      <div className="app-container flex flex-col flex-1">
        <Header />

        <main className="flex-1 my-4">
          {gameState === 'IDLE' && <ModeSelector />}
          {(gameState === 'ACTIVE' || gameState === 'REVEAL') && <QuizArena />}
          {gameState === 'GAME_OVER' && <GameOverSummary />}
          {gameState === 'REVIEW' && <ReviewOverlay />}
        </main>

        <footer className="mt-12 py-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-dim)]">
          <p>&copy; 2026 Adam Barczynski • AI Trivia & Offline Quiz Engine</p>
        </footer>
      </div>

      {/* Modals */}
      <AIConfigModal />
      <StatsModal />
    </div>
  );
}

export default App;
