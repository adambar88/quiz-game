import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';

export const Header: React.FC = () => {
  const { soundMuted, lang } = useQuizStore();

  const toggleLanguage = () => {
    quizStore.setLanguage(lang === 'pl' ? 'en' : 'pl');
  };

  return (
    <header className="flex items-center justify-between py-4 mb-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">
          BrainSprint
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switch toggle */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-emerald-400 border border-[var(--border)] transition-colors flex items-center gap-1"
          title={lang === 'pl' ? 'Przełącz na angielski (EN)' : 'Switch to Polish (PL)'}
        >
          <span>🌐</span>
          <span>{lang.toUpperCase()}</span>
        </button>
        {/* Sound toggle */}
        <button
          onClick={() => quizStore.toggleSound()}
          className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label="Toggle Sound"
        >
          {soundMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Stats modal button */}
        <button
          onClick={() => quizStore.setShowStatsModal(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          title="Lifetime Stats"
          aria-label="Open Lifetime Stats"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* AI config modal button */}
        <button
          onClick={() => quizStore.setShowAIModal(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          title="AI Provider Settings"
          aria-label="AI Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};
