import React, { useEffect } from 'react';
import { quizStore, useQuizStore } from './state/useQuizStore.ts';
import { storageService } from './services/storageService.ts';
import { Header } from './components/Header.tsx';
import { ModeSelector } from './components/ModeSelector.tsx';
import { QuizArena } from './components/QuizArena.tsx';
import { GameOverSummary } from './components/GameOverSummary.tsx';
import { ReviewOverlay } from './components/ReviewOverlay.tsx';
import { GeneratingState } from './components/GeneratingState.tsx';
import { AIConfigModal } from './components/AIConfigModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { VersusLobbyModal } from './components/VersusLobbyModal.tsx';
import { VersusSummary } from './components/VersusSummary.tsx';
import { VersusCategoryPickerModal } from './components/VersusCategoryPickerModal.tsx';
import { VersusWaitingScreen } from './components/VersusWaitingScreen.tsx';
import { peerService } from './services/peerService.ts';

export function App() {
  const { gameState, mode, showVersusLobby, versusRound, versusPickIndex, versusShowCategoryPicker } = useQuizStore();

  const playerCount = Math.max(2, peerService.getConnectedCount());
  const isMyTurnToPick = (versusPickIndex % playerCount) === (peerService.getIsHost() ? 0 : 1);
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

  // Auto-launch versus race lobby when opened via link containing ?room=CODE
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && roomParam.trim().length >= 4) {
      quizStore.setMode('versus');
      quizStore.setShowVersusLobby(true);
    }
  }, []);

  return (
    <div className="min-h-screen pt-10 pb-4 sm:py-8 px-2.5 sm:px-4 flex flex-col justify-between">
      <div className="app-container flex flex-col flex-1">
        <Header />

        <main className="flex-1 my-1.5 sm:my-4">
          {gameState === 'IDLE' && <ModeSelector />}
          {gameState === 'GENERATING' && <GeneratingState />}
          {(gameState === 'ACTIVE' || gameState === 'REVEAL') && <QuizArena />}
          {gameState === 'VERSUS_WAITING' && <VersusWaitingScreen />}
          {gameState === 'GAME_OVER' && (
            mode === 'versus' ? <VersusSummary /> : <GameOverSummary />
          )}
          {gameState === 'REVIEW' && <ReviewOverlay />}
        </main>

        <footer className="mt-4 sm:mt-12 py-2 sm:py-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-dim)]">
          <p>&copy; 2026 Adam Barczynski • MindClash</p>
        </footer>
      </div>

      {/* Modals */}
      <AIConfigModal />
      <StatsModal />
      {showVersusLobby && (
        <VersusLobbyModal
          onStartDuel={() => quizStore.startVersusDuel()}
          onClose={() => quizStore.setShowVersusLobby(false)}
        />
      )}
      {versusShowCategoryPicker && (
        <VersusCategoryPickerModal
          currentRound={versusRound}
          isMyTurn={isMyTurnToPick}
          onCategoryChosen={(cat) => quizStore.handleVersusCategoryChoice(cat)}
        />
      )}
    </div>
  );
}

export default App;
