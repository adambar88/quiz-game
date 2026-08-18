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
    mode,
    lang,
  } = useQuizStore();

  const t = translations[lang] || translations.pl;
  const currentQ = questions[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'ACTIVE') return;

      let idx: number | null = null;
      if (['1', 'a', 'A'].includes(e.key)) idx = 0;
      else if (['2', 'b', 'B'].includes(e.key)) idx = 1;
      else if (['3', 'c', 'C'].includes(e.key)) idx = 2;
      else if (['4', 'd', 'D'].includes(e.key)) idx = 3;

      if (idx !== null) {
        quizStore.selectOption(idx);
        quizStore.submitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  if (!currentQ) {
    return (
      <div className="p-8 glass-panel text-center flex flex-col items-center justify-center gap-3 my-4">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[var(--text-dim)]">Wczytywanie pytań...</p>
      </div>
    );
  }

  const categoryTranslated = (t.categories as Record<string, string>)[currentQ.category] || currentQ.category;
  const difficultyTranslated = t.difficulties[currentQ.difficulty as Difficulty] || currentQ.difficulty;
  const catMeta = CATEGORY_METADATA[currentQ.category];

  const handleOptionClick = (idx: number) => {
    if (gameState !== 'ACTIVE') return;
    quizStore.selectOption(idx);
    quizStore.submitAnswer();
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      {/* Versus Live Race Leaderboard */}
      {mode === 'versus' && <VersusLiveLeaderboard />}

      {/* Top Info Bar */}
      <div className="flex items-center justify-between p-2 sm:p-3 glass-panel text-xs">
        {/* Question Counter */}
        <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
          <span>{t.questionCount} {currentIndex + 1}</span>
          <span className="text-[var(--text-dim)] font-normal">{t.of} {questions.length}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Flame Counter */}
          <div className="flex items-center gap-1 font-mono font-bold" title={t.streak}>
            <span className={streak > 0 ? 'flame-anim text-amber-400' : 'opacity-40'}>🔥</span>
            <span>{streak}</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 font-mono font-bold text-emerald-400">
            <span>🏆 {score}</span>
          </div>

          {/* Exit Button */}
          <button
            onClick={() => {
              if (window.confirm(lang === 'pl' ? 'Czy na pewno chcesz opuścić rozgrywkę?' : 'Are you sure you want to leave the game?')) {
                quizStore.exitToHome();
              }
            }}
            className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-bold transition-all border border-red-500/30 flex items-center gap-1 active:scale-95 ml-1"
            title={lang === 'pl' ? 'Wyjdź do głównego menu' : 'Exit to main menu'}
          >
            <span>🚪</span>
            <span className="hidden sm:inline">{lang === 'pl' ? 'Wyjdź' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* Timer Bar */}
      {gameState === 'ACTIVE' && <TimerRing />}

      {/* Question Card */}
      <div className="p-3 sm:p-5 glass-panel flex flex-col gap-2 sm:gap-2.5 relative overflow-hidden">
        {/* Category & Difficulty Header */}
        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border)] font-semibold flex items-center gap-1.5 text-[var(--text)]">
            <span className="text-xs sm:text-sm">{catMeta?.icon || '💡'}</span>
            <span>{categoryTranslated}</span>
          </div>
          <span className="text-[var(--text-dim)] uppercase font-mono tracking-wider font-medium">
            {t.difficultyLabel}: <strong className="text-emerald-400 font-bold">{difficultyTranslated}</strong>
          </span>
        </div>
        <h2 className="text-sm sm:text-lg font-bold leading-snug text-[var(--text)] pt-0.5">
          {currentQ.question}
        </h2>
      </div>

      {/* Option Buttons Grid — One-tap answer submission */}
      <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
        {currentQ.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedOptionIndex === idx;
          const isCorrectIndex = currentQ.correctIndex === idx;

          let btnStyle = 'bg-white/5 border-[var(--border)] hover:border-emerald-500 hover:bg-white/10';

          if (gameState === 'REVEAL') {
            if (isCorrectIndex) {
              btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold';
            } else if (isSelected && !isCorrectIndex) {
              btnStyle = 'bg-red-500/20 border-red-500 text-red-400 font-bold';
            } else {
              btnStyle = 'bg-white/5 border-[var(--border)] opacity-40';
            }
          }

          return (
            <button
              key={idx}
              disabled={gameState === 'REVEAL'}
              onClick={() => handleOptionClick(idx)}
              className={`p-2 sm:p-3 rounded-xl text-left border transition-all flex items-center justify-between group active:scale-[0.99] ${btnStyle}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 pr-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/10 text-[11px] sm:text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-white/20">
                  {letter}
                </span>
                <span className="text-xs sm:text-sm font-medium leading-tight">{opt}</span>
              </div>
              {gameState === 'REVEAL' && isCorrectIndex && <span className="text-emerald-400 font-bold text-xs sm:text-sm">✓</span>}
              {gameState === 'REVEAL' && isSelected && !isCorrectIndex && <span className="text-red-400 font-bold text-xs sm:text-sm">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Instant Answer Explanation Box during REVEAL */}
      {gameState === 'REVEAL' && <AnswerReveal />}
    </div>
  );
};
