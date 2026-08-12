import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';

export const StatsModal: React.FC = () => {
  const { stats, showStatsModal } = useQuizStore();

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
            <h2 className="text-lg font-bold">Lifetime Statistics</h2>
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
                Games Played
              </span>
              <span className="text-xl font-bold font-mono">{stats.gamesPlayed}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                Overall Accuracy
              </span>
              <span className="text-xl font-bold font-mono text-emerald-400">{accuracy}%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                Highest Streak
              </span>
              <span className="text-xl font-bold font-mono text-amber-400">🔥 {stats.highestStreak}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-[var(--border)] text-center">
              <span className="text-[10px] uppercase font-mono text-[var(--text-dim)] block mb-1">
                Highest ELO
              </span>
              <span className="text-xl font-bold font-mono text-blue-400">{stats.highestEloRating}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <span className="text-xs uppercase font-mono text-purple-300 block mb-1">Total Experience (XP)</span>
            <span className="text-3xl font-extrabold font-mono text-purple-400">+{stats.totalXp} XP</span>
          </div>

          {/* Category Breakdown */}
          {Object.keys(stats.categoryStats).length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2">
                Category Mastery
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.categoryStats).map(([cat, data]) => {
                  const catAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                  return (
                    <div key={cat} className="p-3 rounded-lg bg-white/5 text-xs flex flex-col gap-1">
                      <div className="flex justify-between font-medium">
                        <span>{cat}</span>
                        <span className="font-mono text-emerald-400">{catAcc}% ({data.correct}/{data.total})</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${catAcc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-[var(--border)] text-right">
          <button
            onClick={() => quizStore.setShowStatsModal(false)}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
