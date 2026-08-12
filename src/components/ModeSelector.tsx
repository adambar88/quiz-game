import React from 'react';
import type { Category, Difficulty } from '../types/quiz.ts';
import { VALID_CATEGORIES } from '../ai/validators.ts';
import { quizStore, useQuizStore, type QuizMode } from '../state/useQuizStore.ts';

interface ModeOption {
  id: QuizMode;
  title: string;
  badge: string;
  description: string;
  icon: string;
}

const MODES: ModeOption[] = [
  {
    id: 'classic',
    title: 'Classic 10Q',
    badge: 'Standard',
    description: '10 speed-decay trivia questions. Perfect for quick practice.',
    icon: '⚡',
  },
  {
    id: 'survival',
    title: 'Adaptive Survival',
    badge: 'ELO Dynamic',
    description: '3 lives. Tier steps UP on 3 correct streaks, steps DOWN on mistakes.',
    icon: '🛡️',
  },
  {
    id: 'blitz',
    title: 'Time Attack Blitz',
    badge: '10s Timer',
    description: 'Rapid-fire 10-second timer per question. Maximum focus required!',
    icon: '🔥',
  },
  {
    id: 'custom',
    title: 'Custom AI Topic',
    badge: 'AI Prompt',
    description: 'Specify any custom topic for instant AI question generation.',
    icon: '🧠',
  },
  {
    id: 'daily',
    title: 'Daily Challenge',
    badge: 'Global Seed',
    description: 'Deterministic daily question sequence. Compete with identical seed.',
    icon: '📅',
  },
];

export const ModeSelector: React.FC = () => {
  const { mode, category, difficulty, customPrompt, seedStr, generationError, gameState } = useQuizStore();

  const handleShareSeed = () => {
    navigator.clipboard.writeText(`Quiz Seed: ${seedStr}`);
    alert(`Seed copied to clipboard: ${seedStr}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Error banner if generation failed */}
      {generationError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <p className="font-semibold mb-1">Failed to start quiz:</p>
          <p>{generationError}</p>
        </div>
      )}

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => quizStore.setMode(m.id)}
              className={`p-4 rounded-xl text-left transition-all relative glass-panel ${
                active
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                  : 'hover:border-[var(--border-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{m.icon}</span>
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
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
              Category
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
                All Categories
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
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Prompt Input */}
        {mode === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">
              Custom AI Topic Focus
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => quizStore.setCustomPrompt(e.target.value)}
              placeholder="e.g. Quantum Computing, 90s Hip Hop, Astrophysics..."
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Difficulty Selection */}
        {mode !== 'survival' && mode !== 'daily' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
                Difficulty
              </label>
              <span className="text-xs uppercase font-bold text-emerald-400">{difficulty}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => quizStore.setDifficulty(d)}
                  className={`py-2 rounded-lg text-xs font-semibold uppercase transition-colors ${
                    difficulty === d
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)]'
                  }`}
                >
                  {d}
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
                Daily Date Seed
              </label>
              <button
                onClick={handleShareSeed}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                📋 Copy Seed
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
            Generating Questions...
          </>
        ) : (
          'START QUIZ 🚀'
        )}
      </button>
    </div>
  );
};
