import React from 'react';
import { useQuizStore, getQuestionsPerPick } from '../state/useQuizStore.ts';
import { CATEGORY_METADATA } from '../data/categories.ts';
import { translations } from '../i18n/translations.ts';
import type { Category } from '../types/quiz.ts';
import { peerService } from '../services/peerService.ts';

interface VersusCategoryPickerModalProps {
  currentRound: number;
  isMyTurn: boolean;
  onCategoryChosen: (category: Category) => void;
}

export const VersusCategoryPickerModal: React.FC<VersusCategoryPickerModalProps> = ({
  currentRound,
  isMyTurn,
  onCategoryChosen,
}) => {
  const { lang, versusPickIndex, versusOpponentState, versusPlayerName, questions } = useQuizStore();
  const t = translations[lang] || translations.pl;

  const playerCount = Math.max(2, peerService.getConnectedCount());
  const questionsPerPick = getQuestionsPerPick(playerCount);

  const categoriesList = Object.keys(CATEGORY_METADATA) as Category[];

  const myName = versusPlayerName || (peerService.getIsHost() ? 'Gracz 1' : 'Gracz 2');
  const opponentName = versusOpponentState?.name || (peerService.getIsHost() ? 'Gracz 2' : 'Gracz 1');

  // Check if opponent is still answering current round's questions
  const opponentAnsCount = versusOpponentState?.answers?.length ?? versusOpponentState?.currentIndex ?? 0;
  const isOpponentStillAnswering = Boolean(
    versusOpponentState &&
    !versusOpponentState.isFinished &&
    questions.length > 0 &&
    opponentAnsCount < questions.length
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl p-3.5 sm:p-6 glass-panel rounded-2xl border border-[var(--border)] shadow-2xl space-y-3 sm:space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="text-center space-y-1 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold">
            🏁 Runda {versusPickIndex + 1} ({questionsPerPick} {questionsPerPick === 1 ? 'pytanie' : 'pytania'} z wybranej kategorii)
          </div>
          <h2 className="text-base sm:text-xl font-extrabold tracking-tight">
            {isMyTurn
              ? `🎯 Twoja Kolej na Wybór (${myName})!`
              : isOpponentStillAnswering
              ? `⏳ ${opponentName} Dokańcza Pytania...`
              : `⏳ ${opponentName} Wybiera Kategorię...`}
          </h2>
          <p className="text-[11px] sm:text-xs text-[var(--text-dim)] max-w-md mx-auto leading-tight">
            {isMyTurn
              ? `Wybierz kategorię pytań dla Waszego pojedynku.`
              : isOpponentStillAnswering
              ? `${opponentName} odpowiada jeszcze na pytania z obecnej rundy. Poczekaj na zakończenie tury.`
              : `${opponentName} dokonuje w tym momencie wyboru nowej kategorii dla obu graczy.`}
          </p>
        </div>

        {/* Content Grid */}
        {isMyTurn ? (
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2.5 scrollbar-thin">
            {categoriesList.map((cat) => {
              const meta = CATEGORY_METADATA[cat];
              const categoryName = (t.categories as Record<string, string>)[cat] || cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChosen(cat)}
                  className="p-2 sm:p-3 rounded-xl text-left glass-panel border border-[var(--border)] hover:border-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group h-14 sm:h-20 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${meta.gradient} opacity-15 rounded-bl-full group-hover:opacity-30 transition-opacity`} />
                  <span className="text-xl sm:text-2xl flex-shrink-0 z-10">{meta.icon}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-[var(--text)] leading-snug line-clamp-2 z-10">
                    {categoryName}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 sm:py-10 space-y-3 text-center">
            <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-dim)] animate-pulse">
              Oczekiwanie na ruch drugiego gracza...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
