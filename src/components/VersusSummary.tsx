import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const VersusSummary: React.FC = () => {
  const { score, userAnswers, versusOpponentState, lang } = useQuizStore();
  const t = translations[lang];

  const myCorrect = userAnswers.filter((a) => a.isCorrect).length;
  const totalQ = userAnswers.length;
  const myAccuracy = totalQ > 0 ? Math.round((myCorrect / totalQ) * 100) : 0;

  const opponentScore = versusOpponentState?.score || 0;
  const opponentCorrect = versusOpponentState?.answers?.filter((a) => a.isCorrect).length || 0;
  const opponentAccuracy = versusOpponentState?.accuracy || 0;

  let winnerText = t.draw;
  let winnerColor = 'text-amber-400 border-amber-400/30 bg-amber-500/10';

  if (score > opponentScore) {
    winnerText = t.youWon;
    winnerColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  } else if (opponentScore > score) {
    winnerText = t.opponentWon;
    winnerColor = 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-panel text-center max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Winner Title Badge */}
      <div className={`w-full p-4 rounded-2xl border ${winnerColor} space-y-1 shadow-lg`}>
        <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-dim)]">
          {t.versusWinner}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight">{winnerText}</h2>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="w-full grid grid-cols-2 gap-4">
        {/* Your Stats */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {t.yourScore}
          </span>
          <div className="text-3xl font-black font-mono text-emerald-400">{score}</div>
          <div className="text-xs text-[var(--text-dim)] font-medium">
            {t.accuracy}: <strong className="text-[var(--text)]">{myAccuracy}%</strong> ({myCorrect}/{totalQ})
          </div>
        </div>

        {/* Partner Stats */}
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center space-y-2">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
            {t.opponentScore}
          </span>
          <div className="text-3xl font-black font-mono text-purple-400">{opponentScore}</div>
          <div className="text-xs text-[var(--text-dim)] font-medium">
            {t.accuracy}: <strong className="text-[var(--text)]">{opponentAccuracy}%</strong> ({opponentCorrect}/{totalQ})
          </div>
        </div>
      </div>

      {/* Round-by-Round Breakdown Table */}
      <div className="w-full space-y-2">
        <h3 className="text-xs uppercase font-semibold text-[var(--text-dim)] tracking-wider">
          Przebieg Pojedynku Pytanie po Pytaniu
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {userAnswers.map((myAns, idx) => {
            const oppAns = versusOpponentState?.answers?.[idx];
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 text-xs font-mono"
              >
                <span className="text-[var(--text-dim)] font-bold">Pytanie {idx + 1}</span>
                <div className="flex items-center gap-4">
                  <span className={myAns.isCorrect ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    Ty: {myAns.isCorrect ? '✓' : '✗'} (+{myAns.pointsEarned})
                  </span>
                  <span className={oppAns?.isCorrect ? 'text-purple-400 font-bold' : 'text-red-400 font-bold'}>
                    Partner: {oppAns?.isCorrect ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
        <button
          onClick={() => quizStore.exitToHome()}
          className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all shadow-md"
        >
          {t.playAgain} 🔄
        </button>
        <button
          onClick={() => quizStore.goToReview()}
          className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text)] transition-all border border-[var(--border)]"
        >
          {t.reviewAnswers}
        </button>
      </div>
    </div>
  );
};
