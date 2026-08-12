import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';
import type { Category } from '../types/quiz.ts';

export const GeneratingState: React.FC = () => {
  const { mode, category, customPrompt, aiSettings, lang } = useQuizStore();
  const t = translations[lang];

  const handleCancelAndOffline = () => {
    // Fallback immediately to offline bank and restart quiz
    quizStore.updateAISettings({
      ...aiSettings,
      activeProvider: 'offline',
    });
    quizStore.startQuiz();
  };

  const categoryName = category === 'all' ? t.allCategories : ((t.categories as Record<string, string>)[category] || category);
  const modeTitle = t.modes[mode]?.title || mode;

  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-6 glass-panel text-center max-w-lg mx-auto space-y-6 animate-fadeIn">
      {/* Animated Glowing AI Spinner */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-75" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
        <span className="text-3xl relative z-10">🤖</span>
      </div>

      {/* Title & Status */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">{t.generatingTitle}</h2>
        <p className="text-xs text-[var(--text-dim)] max-w-sm mx-auto leading-relaxed">
          {t.generatingSubtitle}
        </p>
      </div>

      {/* Target Details Badge */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-[var(--border)] text-[var(--text-dim)]">
          {t.generatingDetailsMode}: <strong className="text-[var(--text)]">{modeTitle}</strong>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-[var(--border)] text-[var(--text-dim)]">
          {t.generatingDetailsTopic}:{' '}
          <strong className="text-[var(--text)]">
            {customPrompt || categoryName}
          </strong>
        </span>
      </div>

      {/* Progress Bar / Shimmer Bar */}
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-[var(--border)] relative">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-full animate-pulse" />
      </div>

      {/* Cancel / Immediate Offline Fallback Option */}
      <div className="pt-2">
        <button
          onClick={handleCancelAndOffline}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text-dim)] transition-colors border border-[var(--border)] flex items-center gap-2 mx-auto"
        >
          {t.switchToOffline}
        </button>
      </div>
    </div>
  );
};
