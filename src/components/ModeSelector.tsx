import React from 'react';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';
import { CATEGORY_METADATA } from '../data/categories.ts';
import type { QuizMode, Category, Difficulty } from '../types/quiz.ts';

const VALID_CATEGORIES: Category[] = Object.keys(CATEGORY_METADATA) as Category[];

export const ModeSelector: React.FC = () => {
  const {
    mode,
    category,
    difficulty,
    gameState,
    generationError,
    lang,
  } = useQuizStore();

  const t = translations[lang] || translations.pl;

  const modeKeys: QuizMode[] = ['classic', 'versus'];
  const modeIcons: Record<QuizMode, string> = {
    classic: '👤',
    versus: '🏁',
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Error banner if generation failed */}
      {generationError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <p className="font-semibold mb-1">Błąd:</p>
          <p>{generationError}</p>
        </div>
      )}

      {/* Mode Selection Cards (2 mode cards: Solo vs Wyścig) */}
      <div className="grid grid-cols-2 gap-3">
        {modeKeys.map((modeId) => {
          const m = t.modes[modeId];
          const active = mode === modeId;
          return (
            <button
              key={modeId}
              onClick={() => quizStore.setMode(modeId)}
              className={`p-3 sm:p-4 rounded-2xl text-left transition-all relative glass-panel flex flex-col justify-between h-full ${
                active
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'hover:border-[var(--border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl">{modeIcons[modeId]}</span>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    active ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-white/5 text-[var(--text-dim)]'
                  }`}
                >
                  {m.badge}
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base mb-1 truncate">{m.title}</h3>
                <p className="text-[11px] sm:text-xs text-[var(--text-dim)] leading-snug line-clamp-2">{m.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Specific Controls */}
      <div className="p-3.5 sm:p-5 glass-panel flex flex-col gap-3.5 sm:gap-4">
        {/* Category Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] sm:text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              {t.categoryLabel}
            </label>
            <span className="text-[10px] sm:text-[11px] font-mono text-[var(--text-dim)]">
              {category === 'all' ? t.allCategories : ((t.categories as Record<string, string>)[category] || category)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[180px] sm:max-h-[220px] overflow-y-auto pr-1 py-0.5 scrollbar-thin">
            <button
              onClick={() => quizStore.setCategory('all')}
              className={`px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 active:scale-95 ${
                category === 'all'
                  ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)] hover:text-white border-[var(--border)]'
              }`}
            >
              <span className="text-xs sm:text-sm">🎲</span>
              <span>{t.allCategories}</span>
            </button>
            {VALID_CATEGORIES.map((cat) => {
              const meta = CATEGORY_METADATA[cat as Category];
              const isSelected = category === cat;
              const catName = (t.categories as Record<string, string>)[cat] || cat;

              return (
                <button
                  key={cat}
                  onClick={() => quizStore.setCategory(cat as Category)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 active:scale-95 group ${
                    isSelected
                      ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 text-[var(--text)] border-[var(--border)]'
                  }`}
                >
                  <span className="text-xs sm:text-sm transition-transform group-hover:scale-110 flex-shrink-0">
                    {meta?.icon || '💡'}
                  </span>
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              {t.difficultyLabel}
            </label>
            <span className="text-[10px] sm:text-xs uppercase font-bold text-emerald-400">
              {difficulty === 'dynamic' ? 'Dynamic' : t.difficulties[difficulty as Difficulty]}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => quizStore.setDifficulty(d)}
                className={`py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors ${
                  difficulty === d
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)]'
                }`}
              >
                {t.difficulties[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Start Quiz Button */}
      <button
        onClick={() => {
          if (mode === 'versus') {
            quizStore.setShowVersusLobby(true);
          } else {
            quizStore.startQuiz();
          }
        }}
        disabled={gameState === 'GENERATING'}
        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {gameState === 'GENERATING' ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.generating}
          </>
        ) : mode === 'versus' ? (
          '🏁 Otwórz Lobby Wyścigu'
        ) : (
          '🎮 Rozpocznij Grać Solo'
        )}
      </button>
    </div>
  );
};
