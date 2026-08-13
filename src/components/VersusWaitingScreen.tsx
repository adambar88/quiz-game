import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { VersusLiveLeaderboard } from './VersusLiveLeaderboard.tsx';
import { translations } from '../i18n/translations.ts';

export const VersusWaitingScreen: React.FC = () => {
  const { lang } = useQuizStore();
  const t = translations[lang];

  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] p-6 glass-panel text-center max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Animated Glowing Spinner */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-75" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
        <span className="text-3xl relative z-10">⏳</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">{t.versusWaitingTitle || 'Oczekiwanie na Zakończenie Gry'}</h2>
        <p className="text-xs text-[var(--text-dim)] max-w-md mx-auto leading-relaxed">
          {t.versusWaitingSub || 'Pozostali gracze kończą swoje pytania. Końcowa klasyfikacja wyświetli się automatycznie po zakończeniu gry przez wszystkich.'}
        </p>
      </div>

      {/* Live Race Leaderboard */}
      <div className="w-full">
        <VersusLiveLeaderboard />
      </div>

      {/* Fallback Manual Summary Action */}
      <button
        onClick={() => quizStore.forceVersusGameOver()}
        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text-dim)] hover:text-white transition-all border border-[var(--border)] flex items-center gap-2 mx-auto"
      >
        <span>{t.versusForceSummary || 'Pokaż moje podsumowanie teraz ➔'}</span>
      </button>
    </div>
  );
};
