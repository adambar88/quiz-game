import React, { useState } from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const ReviewOverlay: React.FC = () => {
  const { userAnswers, gameState, lang } = useQuizStore();
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong'>('all');
  const t = translations[lang];

  if (gameState !== 'REVIEW') return null;

  const filteredAnswers = userAnswers.filter((ans) => {
    if (filter === 'correct') return ans.isCorrect;
    if (filter === 'wrong') return !ans.isCorrect;
    return true;
  });

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h2 className="text-lg font-bold">{t.reviewTitle}</h2>
        </div>
        <button
          onClick={() => quizStore.exitToHome()}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
        >
          {t.close}
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 text-xs">
        {(['all', 'correct', 'wrong'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg uppercase font-semibold transition-colors ${
              filter === f
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)]'
            }`}
          >
            {f} ({f === 'all' ? userAnswers.length : userAnswers.filter((a) => (f === 'correct' ? a.isCorrect : !a.isCorrect)).length})
          </button>
        ))}
      </div>

      {/* Answers List */}
      <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
        {filteredAnswers.map((item, idx) => {
          const q = item.question;
          return (
            <div key={idx} className="p-4 rounded-xl glass-panel flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-bold">Q{idx + 1}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    item.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {item.isCorrect ? `+${item.pointsEarned} pkt` : '0 pkt'}
                </span>
              </div>

              <h3 className="text-sm font-bold leading-snug">{q.question}</h3>

              {/* Options */}
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {q.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isUserSelection = item.selectedIndex === optIdx;
                  const isCorrectAnswer = q.correctIndex === optIdx;

                  let optionStyle = 'bg-white/5 text-[var(--text-dim)] border-transparent';
                  if (isCorrectAnswer) {
                    optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold';
                  } else if (isUserSelection && !isCorrectAnswer) {
                    optionStyle = 'bg-red-500/20 border-red-500 text-red-400 font-bold';
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${optionStyle}`}
                    >
                      <span>
                        <strong className="mr-2 font-mono">{letter}.</strong> {opt}
                      </span>
                      {isCorrectAnswer && <span>✓ {t.correctAnswer}</span>}
                      {isUserSelection && !isCorrectAnswer && <span>✗ {t.yourAnswer}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-lg bg-black/30 text-xs text-[var(--text-dim)] leading-relaxed">
                <strong className="text-[var(--text)] block mb-0.5">{t.explanation}:</strong>
                {q.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
