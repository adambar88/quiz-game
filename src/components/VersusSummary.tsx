import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';
import { peerService } from '../services/peerService.ts';

export const VersusSummary: React.FC = () => {
  const { score, userAnswers, versusPlayers, versusPlayerName, lang } = useQuizStore();
  const t = translations[lang];

  const myId = peerService.getMyId();
  const myName = versusPlayerName || (peerService.getIsHost() ? 'Gracz 1' : 'Gracz 2');

  const myCorrect = userAnswers.filter((a) => a.isCorrect).length;
  const totalQ = userAnswers.length;
  const myAccuracy = totalQ > 0 ? Math.round((myCorrect / totalQ) * 100) : 0;

  const myPlayerState = {
    id: myId,
    name: myName,
    score,
    accuracy: myAccuracy,
    answers: userAnswers.map((a) => ({ isCorrect: a.isCorrect, timeMs: a.timeSpentMs })),
  };

  const allPlayersMap = new Map<string, typeof myPlayerState>();
  allPlayersMap.set(myId, myPlayerState);

  versusPlayers.forEach((p) => {
    if (p && p.id) {
      allPlayersMap.set(p.id, {
        id: p.id,
        name: p.name || 'Gracz',
        score: p.score || 0,
        accuracy: p.accuracy || 0,
        answers: p.answers || [],
      });
    }
  });

  const sortedPlayers = Array.from(allPlayersMap.values()).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isWinnerMe = winner?.id === myId;

  const getRankBadge = (idx: number) => {
    if (idx === 0) return '🥇 ZWYCIĘZCA';
    if (idx === 1) return '🥈 2. MIEJSCE';
    if (idx === 2) return '🥉 3. MIEJSCE';
    return `${idx + 1}. MIEJSCE`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-panel text-center max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Winner Banner */}
      <div className={`w-full p-5 rounded-2xl border space-y-1 shadow-lg ${
        isWinnerMe
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
      }`}>
        <span className="text-xs uppercase font-mono tracking-widest text-[var(--text-dim)]">
          🏆 PODSUMOWANIE WYŚCIGU
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {isWinnerMe ? `Wygrałeś Wyścig, ${myName}! 🎉` : `Wygrywa ${winner?.name}! 👑`}
        </h2>
      </div>

      {/* Leaderboard Table (2-4 players) */}
      <div className="w-full space-y-2">
        <h3 className="text-xs uppercase font-semibold text-[var(--text-dim)] tracking-wider">
          Końcowa Klasyfikacja Graczy
        </h3>
        <div className="space-y-2">
          {sortedPlayers.map((p, idx) => {
            const isMe = p.id === myId;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-extrabold ring-1 ring-emerald-500/40'
                    : 'bg-white/5 border-[var(--border)] text-[var(--text)]'
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-white/10">
                    {getRankBadge(idx)}
                  </span>
                  <div>
                    <span className="font-bold text-sm">{p.name} {isMe ? '(Ty)' : ''}</span>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      Celność: <strong className="text-[var(--text)]">{p.accuracy}%</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xl font-extrabold text-emerald-400">{p.score} pkt</div>
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
          className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all shadow-md"
        >
          Zagraj Ponownie 🔄
        </button>
        <button
          onClick={() => quizStore.goToReview()}
          className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--text)] transition-all border border-[var(--border)]"
        >
          {t.reviewAnswers}
        </button>
      </div>
    </div>
  );
};
