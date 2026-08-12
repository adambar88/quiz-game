import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const AnswerReveal: React.FC = () => {
  const { isCorrect, pointsEarned, questions, currentIndex, streak, lang } = useQuizStore();
  const currentQ = questions[currentIndex];
  const t = translations[lang];

  if (!currentQ) return null;

  const streakMultiplierStr = streak > 1 ? ` (${(1 + Math.min(2, streak * 0.25)).toFixed(2)}x)` : '';

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Feedback Banner */}
      <div
        className={`p-4 rounded-xl flex items-center justify-between border ${
          isCorrect
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
          <div>
            <h3 className="font-bold text-base">{isCorrect ? t.correct : t.wrong}</h3>
            <p className="text-xs opacity-90">
              {isCorrect ? `+${pointsEarned} pkt${streakMultiplierStr}` : `${t.correctAnswer}: ${String.fromCharCode(65 + currentQ.correctIndex)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="p-4 rounded-xl glass-panel space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
          {t.explanation}
        </h4>
        <p className="text-sm leading-relaxed text-[var(--text)]">{currentQ.explanation}</p>
      </div>

      {/* Next Question CTA Button */}
      <button
        onClick={() => quizStore.nextQuestion()}
        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span>{t.next}</span>
      </button>
    </div>
  );
};
