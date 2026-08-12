import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const StatsModal: React.FC = () => {
  const { stats, showStatsModal, lang } = useQuizStore();
  const t = translations[lang];

  if (!showStatsModal) return null;

  const totalQ = stats.totalQuestionsAnswered;
  const accuracy = totalQ > 0 ? Math.round((stats.totalCorrect / totalQ) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-bold">{t.statsTitle}</h2>
          </div>
          <button
            onClick={() => quizStore.setShowStatsModal(false)}
            className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                {t.gamesPlayed}
              </span>
              <span className="text-xl font-bold font-mono">{stats.gamesPlayed}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                {t.accuracy}
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">{accuracy}%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                {t.bestStreak}
              </span>
              <span className="text-xl font-bold font-mono text-amber-400">🔥 {stats.highestStreak}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                {t.highestElo}
              </span>
              <span className="text-xl font-bold font-mono text-blue-400">{stats.highestEloRating}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-xs uppercase font-mono text-purple-300 block mb-1">{t.xpEarned}</span>
            <span className="text-3xl font-extrabold font-mono text-purple-400">+{stats.totalXp} XP</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[var(--border)] text-right">
          <button
            onClick={() => quizStore.setShowStatsModal(false)}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
