import React, { useEffect } from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { TimerRing } from './TimerRing.tsx';
import { AnswerReveal } from './AnswerReveal.tsx';
import { translations } from '../i18n/translations.ts';
import type { Category, Difficulty } from '../types/quiz.ts';

import { CATEGORY_METADATA } from '../data/categories.ts';

import { VersusLiveLeaderboard } from './VersusLiveLeaderboard.tsx';

export const QuizArena: React.FC = () => {
  const {
    questions,
    currentIndex,
    selectedOptionIndex,
    gameState,
    score,
    streak,
    lives,
    mode,
    eloState,
    versusOpponentState,
    lang,
  } = useQuizStore();

  const t = translations[lang];
  const currentQ = questions[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'ACTIVE') return;

      if (['1', 'a', 'A'].includes(e.key)) quizStore.selectOption(0);
      else if (['2', 'b', 'B'].includes(e.key)) quizStore.selectOption(1);
      else if (['3', 'c', 'C'].includes(e.key)) quizStore.selectOption(2);
      else if (['4', 'd', 'D'].includes(e.key)) quizStore.selectOption(3);
      else if (e.key === 'Enter' && selectedOptionIndex !== null) quizStore.submitAnswer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedOptionIndex]);

  if (!currentQ) return null;

  const categoryTranslated = (t.categories as Record<string, string>)[currentQ.category] || currentQ.category;
  const difficultyTranslated = t.difficulties[currentQ.difficulty as Difficulty] || currentQ.difficulty;
  const catMeta = CATEGORY_METADATA[currentQ.category];

  return (
    <div className="flex flex-col gap-5">
      {/* Versus Live Race Leaderboard */}
      {mode === 'versus' && <VersusLiveLeaderboard />}

      {/* Top Info Bar */}
      <div className="flex items-center justify-between p-3.5 glass-panel text-xs">
        {/* Question Counter & Category */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-emerald-400">
            {t.questionCount} {currentIndex + 1} {t.of} {questions.length}
          </span>
          <span className="text-[var(--text-dim)]">•</span>
          <span className="px-2 py-0.5 rounded bg-white/5 font-medium flex items-center gap-1">
            <span>{catMeta?.icon || '💡'}</span>
            <span>{categoryTranslated}</span>
          </span>
        </div>

        {/* Mode Specific Stats (Lives for survival / ELO rating) */}
        <div className="flex items-center gap-4">
          {mode === 'survival' && (
            <div className="flex items-center gap-1 text-red-400 font-bold" title={t.lives}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}>
                  ❤️
                </span>
              ))}
            </div>
          )}

          {/* Streak Flame Counter */}
          <div className="flex items-center gap-1 font-mono font-bold" title={t.streak}>
            <span className={streak > 0 ? 'flame-anim text-amber-400' : 'opacity-40'}>🔥</span>
            <span>{streak}</span>
            {streak > 1 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                {(1 + Math.min(2, streak * 0.25)).toFixed(2)}x
              </span>
            )}
          </div>

          {/* Versus Opponent Score Badge */}
          {mode === 'versus' && (
            <div className="flex items-center gap-1.5 font-mono font-bold bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-lg text-purple-400">
              <span>⚔️ Partner: {versusOpponentState?.score || 0}</span>
            </div>
          )}

          {/* Score */}
          <div className="flex items-center gap-1 font-mono font-bold text-emerald-400">
            <span>🏆 {score}</span>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      {gameState === 'ACTIVE' && <TimerRing />}

      {/* Question Card */}
      <div className="p-6 glass-panel flex flex-col gap-3 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-[var(--text-dim)] uppercase font-mono">
          <span>{t.difficultyLabel}: <strong className="text-emerald-400">{difficultyTranslated}</strong></span>
          {mode === 'survival' && <span>Tier: <strong className="text-amber-400">{eloState.tier}</strong></span>}
        </div>
        <h2 className="text-lg sm:text-xl font-bold leading-snug text-[var(--text)]">
          {currentQ.question}
        </h2>
      </div>

      {/* Option Buttons Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {currentQ.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOptionIndex === idx;
          const isCorrectIndex = currentQ.correctIndex === idx;

          let btnStyle = 'bg-white/5 border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-white/10';

          if (gameState === 'REVEAL') {
            if (isCorrectIndex) {
              btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold';
            } else if (isSelected && !isCorrectIndex) {
              btnStyle = 'bg-red-500/20 border-red-500 text-red-400 font-bold';
            } else {
              btnStyle = 'bg-white/5 border-[var(--border)] opacity-40';
            }
          } else if (isSelected) {
            btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold ring-1 ring-emerald-500';
          }

          return (
            <button
              key={idx}
              disabled={gameState === 'REVEAL'}
              onClick={() => quizStore.selectOption(idx)}
              className={`p-4 rounded-xl text-left border transition-all flex items-center justify-between group active:scale-[0.995] ${btnStyle}`}
            >
              <div className="flex items-center gap-3 pr-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-white/20">
                  {letter}
                </span>
                <span className="text-sm font-medium leading-normal">{opt}</span>
              </div>
              {gameState === 'REVEAL' && isCorrectIndex && <span className="text-emerald-400 font-bold">✓</span>}
              {gameState === 'REVEAL' && isSelected && !isCorrectIndex && <span className="text-red-400 font-bold">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Submit CTA Button when option selected */}
      {gameState === 'ACTIVE' && selectedOptionIndex !== null && (
        <button
          onClick={() => quizStore.submitAnswer()}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.99] animate-in fade-in duration-150"
        >
          {t.submit} ↵
        </button>
      )}

      {/* Reveal Explanation Overlay when in REVEAL state */}
      {gameState === 'REVEAL' && <AnswerReveal />}
    </div>
  );
};
