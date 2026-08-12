import React from 'react';
import type { Category, Difficulty } from '../types/quiz.ts';
import { VALID_CATEGORIES } from '../ai/validators.ts';
import { quizStore, useQuizStore, type QuizMode } from '../state/useQuizStore.ts';
import { translations } from '../i18n/translations.ts';

export const ModeSelector: React.FC = () => {
  const { mode, category, difficulty, customPrompt, seedStr, generationError, gameState, lang } = useQuizStore();
  const t = translations[lang];

  const handleShareSeed = () => {
    navigator.clipboard.writeText(`Quiz Seed: ${seedStr}`);
    alert(`${t.seedCopied} ${seedStr}`);
  };

  const modeKeys: QuizMode[] = ['classic', 'survival', 'blitz', 'custom', 'daily'];
  const modeIcons: Record<QuizMode, string> = {
    classic: '⚡',
    survival: '🛡️',
    blitz: '🔥',
    custom: '🧠',
    daily: '📅',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Error banner if generation failed */}
      {generationError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <p className="font-semibold mb-1">Error:</p>
          <p>{generationError}</p>
        </div>
      )}

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modeKeys.map((modeId) => {
          const m = t.modes[modeId];
          const active = mode === modeId;
          return (
            <button
              key={modeId}
              onClick={() => quizStore.setMode(modeId)}
              className={`p-4 rounded-xl text-left transition-all relative glass-panel ${
                active
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                  : 'hover:border-[var(--border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{modeIcons[modeId]}</span>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                    active ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-white/5 text-[var(--text-dim)]'
                  }`}
                >
                  {m.badge}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-1">{m.title}</h3>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">{m.description}</p>
            </button>
          );
        })}
      </div>

      {/* Mode Specific Controls */}
      <div className="p-5 glass-panel flex flex-col gap-4">
        {/* Category Selection */}
        {mode !== 'daily' && mode !== 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">
              {t.categoryLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => quizStore.setCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === 'all'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)]'
                }`}
              >
                {t.allCategories}
              </button>
              {VALID_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => quizStore.setCategory(cat as Category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)]'
                  }`}
                >
                  {t.categories[cat as Category] || cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Prompt Input */}
        {mode === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">
              {t.customPromptLabel}
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => quizStore.setCustomPrompt(e.target.value)}
              placeholder={t.customPromptPlaceholder}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Difficulty Selection */}
        {mode !== 'survival' && mode !== 'daily' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
                {t.difficultyLabel}
              </label>
              <span className="text-xs uppercase font-bold text-emerald-400">
                {difficulty === 'dynamic' ? 'Dynamic' : t.difficulties[difficulty as Difficulty]}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => quizStore.setDifficulty(d)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
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
        )}

        {/* Seed Bar for Daily Challenge */}
        {mode === 'daily' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
                {t.dailySeedLabel}
              </label>
              <button
                onClick={handleShareSeed}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                📋 {t.copySeed}
              </button>
            </div>
            <input
              type="date"
              value={seedStr}
              onChange={(e) => quizStore.setSeedStr(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Start Quiz Button */}
      <button
        onClick={() => quizStore.startQuiz()}
        disabled={gameState === 'GENERATING'}
        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {gameState === 'GENERATING' ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t.generating}
          </>
        ) : (
          t.startQuiz
        )}
      </button>
    </div>
  );
};
