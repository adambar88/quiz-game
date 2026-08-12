import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const GameOverSummary: React.FC = () => {
  const { score, highestStreak, userAnswers, mode, eloState, seedStr, lang } = useQuizStore();
  const t = translations[lang];

  const totalQuestions = userAnswers.length;
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const xpEarned = Math.round(score * 0.5 + correctCount * 50 + highestStreak * 25);

  const handleShareResults = () => {
    const text = `🎯 Quiz — barczynski.dev\n${t.modes[mode]?.title || mode}\n${t.score}: ${score} | ${t.accuracy}: ${accuracy}%\n${t.bestStreak}: 🔥 ${highestStreak}\nXP: +${xpEarned} XP\nSeed: ${seedStr}`;
    navigator.clipboard.writeText(text);
    alert(t.seedCopied + ' ' + seedStr);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Victory Header Card */}
      <div className="p-6 glass-panel text-center flex flex-col items-center gap-2 border-emerald-500/30">
        <span className="text-4xl mb-1">🎉</span>
        <h2 className="text-2xl font-bold tracking-tight">{t.gameOverTitle}</h2>
        
        <div className="mt-3 py-2 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block">{t.finalScore}</span>
          <span className="text-4xl font-extrabold font-mono text-emerald-400">{score}</span>
        </div>
      </div>

      {/* Grid Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 glass-panel flex flex-col items-center">
          <span className="text-xs text-[var(--text-dim)] uppercase font-mono mb-1">{t.accuracy}</span>
          <span className="text-xl font-bold font-mono">{accuracy}%</span>
          <span className="text-[10px] text-[var(--text-dim)]">({correctCount} / {totalQuestions})</span>
        </div>

        <div className="p-4 glass-panel flex flex-col items-center">
          <span className="text-xs text-[var(--text-dim)] uppercase font-mono mb-1">{t.bestStreak}</span>
          <span className="text-xl font-bold font-mono text-amber-400">🔥 {highestStreak}</span>
        </div>

        <div className="p-4 glass-panel flex flex-col items-center">
          <span className="text-xs text-[var(--text-dim)] uppercase font-mono mb-1">{t.xpEarned}</span>
          <span className="text-xl font-bold font-mono text-purple-400">+{xpEarned} XP</span>
        </div>

        {mode === 'survival' ? (
          <div className="p-4 glass-panel flex flex-col items-center">
            <span className="text-xs text-[var(--text-dim)] uppercase font-mono mb-1">{t.eloRating}</span>
            <span className="text-xl font-bold font-mono text-blue-400">{eloState.playerRating}</span>
          </div>
        ) : (
          <div className="p-4 glass-panel flex flex-col items-center">
            <span className="text-xs text-[var(--text-dim)] uppercase font-mono mb-1">Tryb</span>
            <span className="text-base font-bold uppercase font-mono text-emerald-400">{t.modes[mode]?.title || mode}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => quizStore.goToReview()}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
        >
          🔍 {t.reviewAnswers}
        </button>

        <button
          onClick={handleShareResults}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
        >
          📋 {t.copySeed}
        </button>

        <button
          onClick={() => quizStore.exitToHome()}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
        >
          {t.playAgain} 🔄
        </button>
      </div>
    </div>
  );
};
