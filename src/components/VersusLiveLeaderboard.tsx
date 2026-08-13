import React from 'react';
import { useQuizStore, getQuestionsPerPick } from '../state/useQuizStore.ts';
import { peerService } from '../services/peerService.ts';

export const VersusLiveLeaderboard: React.FC = () => {
  const { versusPlayers, score, versusPlayerName, userAnswers } = useQuizStore();

  const myId = peerService.getMyId();
  const myName = versusPlayerName || (peerService.getIsHost() ? 'Gracz 1' : 'Gracz 2');

  const totalQ = userAnswers.length;
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;

  const playerCount = Math.max(2, peerService.getConnectedCount());
  const questionsPerPick = getQuestionsPerPick(playerCount);

  const myPlayerState = {
    id: myId,
    name: myName,
    score,
    streak: 0,
    lives: 3,
    currentIndex: totalQ,
    isFinished: totalQ >= 12,
    accuracy: totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0,
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
        streak: p.streak || 0,
        lives: p.lives || 3,
        currentIndex: p.currentIndex || 0,
        isFinished: p.isFinished || (p.currentIndex ? p.currentIndex >= 12 : false),
        accuracy: p.accuracy || 0,
        answers: p.answers || [],
      });
    }
  });

  const sortedPlayers = Array.from(allPlayersMap.values()).sort((a, b) => b.score - a.score);

  const getRankBadge = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}.`;
  };

  const getPlayerProgressPill = (player: typeof myPlayerState) => {
    if (player.isFinished || player.currentIndex >= 12) {
      return <span className="text-[10px] text-emerald-400 font-bold font-mono">Koniec 🏁</span>;
    }
    const currentQ = Math.min(12, player.currentIndex + 1);
    const isWaitingForCategory = player.currentIndex > 0 && player.currentIndex % questionsPerPick === 0;

    if (isWaitingForCategory) {
      return <span className="text-[10px] text-amber-400 font-bold font-mono animate-pulse">Czeka ⏳</span>;
    }

    return (
      <span className="text-[10px] text-[var(--text-dim)] font-mono">
        Pyt. <strong className="text-[var(--text)]">{currentQ}</strong>/12
      </span>
    );
  };

  return (
    <div className="w-full p-3 glass-panel rounded-xl border border-[var(--border)] space-y-2 animate-fadeIn">
      <div className="flex items-center justify-between text-xs uppercase font-mono font-bold text-[var(--text-dim)] px-1">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          🏎️ Wyścig na Żywo (Tablica Liderów)
        </span>
        <span>{sortedPlayers.length} Uczestników</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sortedPlayers.map((player, idx) => {
          const isMe = player.id === myId;
          return (
            <div
              key={player.id || idx}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                isMe
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-extrabold ring-1 ring-emerald-500/50 shadow-md'
                  : 'bg-white/5 border-[var(--border)] text-[var(--text)]'
              }`}
            >
              <div className="flex flex-col truncate pr-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm">{getRankBadge(idx)}</span>
                  <span className="truncate max-w-[70px]" title={player.name}>
                    {player.name}
                  </span>
                </div>
                <div className="pl-5 text-[10px]">
                  {getPlayerProgressPill(player)}
                </div>
              </div>
              <div className="font-mono font-extrabold text-right text-emerald-400">
                <span className="text-sm">{player.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
