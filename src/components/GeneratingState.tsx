import React, { useEffect, useState } from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const GeneratingState: React.FC = () => {
  const { mode, category, customPrompt, aiSettings, lang } = useQuizStore();
  const t = translations[lang];

  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const handleCancelAndOffline = () => {
    quizStore.updateAISettings({
      ...aiSettings,
      activeProvider: 'offline',
    });
    quizStore.startQuiz();
  };

  const categoryName = category === 'all' ? t.allCategories : ((t.categories as Record<string, string>)[category] || category);
  const modeTitle = t.modes[mode]?.title || mode;

  // Smoothly fill progress bar up to 95% over ~5 seconds (or cap at 98% if longer)
  const progressPercent = Math.min(98, Math.round((elapsedMs / 5200) * 100));

  // Determine current stage description
  let currentStageText = t.generatingStage1;
  if (elapsedMs > 4500) {
    currentStageText = t.generatingStage4;
  } else if (elapsedMs > 3000) {
    currentStageText = t.generatingStage3;
  } else if (elapsedMs > 1200) {
    currentStageText = t.generatingStage2;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] p-6 glass-panel text-center max-w-lg mx-auto space-y-6 animate-fadeIn">
      {/* Animated Glowing Spinner & Target Icon */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-75" />
        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
        <span className="text-3xl relative z-10">🎯</span>
      </div>

      {/* Title & Status */}
      <div className="space-y-1.5">
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

      {/* Real-time Progress Bar Container */}
      <div className="w-full space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono font-semibold px-1">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {currentStageText}
          </span>
          <span className="text-[var(--text-dim)] font-bold">{progressPercent}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-[var(--border)] relative p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Cancel / Immediate Offline Fallback Option */}
      <div className="pt-1">
        <button
          onClick={handleCancelAndOffline}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text-dim)] hover:text-white transition-all border border-[var(--border)] flex items-center gap-2 mx-auto"
        >
          {t.switchToOffline}
        </button>
      </div>
    </div>
  );
};
