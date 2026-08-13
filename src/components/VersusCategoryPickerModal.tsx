import React from 'react';
import { useQuizStore, quizStore } from '../state/useQuizStore.ts';
import { CATEGORY_METADATA } from '../data/categories.ts';
import { translations } from '../i18n/translations.ts';
import type { Category } from '../types/quiz.ts';
import { peerService } from '../services/peerService.ts';

interface VersusCategoryPickerModalProps {
  currentRound: number; // 1, 2, 3, or 4
  isMyTurn: boolean;
  onCategoryChosen: (category: Category) => void;
}

export const VersusCategoryPickerModal: React.FC<VersusCategoryPickerModalProps> = ({
  currentRound,
  isMyTurn,
  onCategoryChosen,
}) => {
  const { lang } = useQuizStore();
  const t = translations[lang];

  const categoriesList = Object.keys(CATEGORY_METADATA) as Category[];

  const handleSelectCategory = (cat: Category) => {
    onCategoryChosen(cat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl p-6 glass-panel rounded-2xl border border-[var(--border)] shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="text-center space-y-1.5 flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            ⚔️ Runda {currentRound} z 4 (Pytania {(currentRound - 1) * 3 + 1}-{(currentRound) * 3})
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {isMyTurn ? '🎯 Wybierz Kategorię dla OBU Graczy' : '⏳ Partner Wybiera Kategorię...'}
          </h2>
          <p className="text-xs text-[var(--text-dim)] max-w-md mx-auto">
            {isMyTurn
              ? 'Twoja kolej! Wybrana kategoria zdeterminuje kolejne 3 pytania w pojedynku.'
              : 'Drugi gracz dokonuje wyboru kategorii na tę rundę.'}
          </p>
        </div>

        {/* Content */}
        {isMyTurn ? (
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categoriesList.map((cat) => {
              const meta = CATEGORY_METADATA[cat];
              const categoryName = (t.categories as Record<string, string>)[cat] || cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className="p-3 rounded-xl text-left glass-panel border border-[var(--border)] hover:border-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between group h-24 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${meta.gradient} opacity-10 rounded-bl-full group-hover:opacity-25 transition-opacity`} />
                  <div className="flex items-center justify-between z-10">
                    <span className="text-2xl">{meta.icon}</span>
                    <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Wybierz →
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[var(--text)] leading-snug line-clamp-2 z-10">
                    {categoryName}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-xs text-[var(--text-dim)] font-mono animate-pulse">
              Oczekiwanie na przesłanie wyboru przez partnera...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
