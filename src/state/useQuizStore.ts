import { useSyncExternalStore } from 'react';
import type { Category, Difficulty, EloState, Question } from '../types/quiz.ts';
import { calculateQuestionScore } from '../algorithms/scoring.ts';
import { createInitialEloState, TIER_BASE_ELO, updateEloState } from '../algorithms/elo.ts';
import { soundEngine } from '../services/soundEngine.ts';
import { haptics } from '../services/haptics.ts';
import { storageService, type AISettings, type QuizStats } from '../services/storageService.ts';
import { QuestionEngine } from '../services/questionEngine.ts';

import { translations, type Language } from '../i18n/translations.ts';

export type GameState = 'IDLE' | 'GENERATING' | 'ACTIVE' | 'REVEAL' | 'GAME_OVER' | 'REVIEW';
export type QuizMode = 'classic' | 'survival' | 'blitz' | 'custom' | 'daily';

export interface UserAnswerRecord {
  question: Question;
  selectedIndex: number | null;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpentMs: number;
}

export interface QuizStoreState {
  gameState: GameState;
  mode: QuizMode;
  category: Category | 'all';
  difficulty: Difficulty | 'dynamic';
  questionCount: number;
  customPrompt: string;
  seedStr: string;
  lang: Language;

  questions: Question[];
  currentIndex: number;
  selectedOptionIndex: number | null;
  isCorrect: boolean | null;
  pointsEarned: number;

  score: number;
  streak: number;
  highestStreak: number;
  lives: number;
  eloState: EloState;

  timeRemainingMs: number;
  timeLimitMs: number;
  questionStartTime: number;

  userAnswers: UserAnswerRecord[];
  aiSettings: AISettings;
  soundMuted: boolean;

  stats: QuizStats;
  showAIModal: boolean;
  showStatsModal: boolean;
  generationError: string | null;
}

const DEFAULT_TIME_LIMITS: Record<Difficulty, number> = {
  easy: 15000,
  medium: 20000,
  hard: 20000,
  expert: 25000,
};

let storeState: QuizStoreState = {
  gameState: 'IDLE',
  mode: 'classic',
  category: 'all',
  difficulty: 'medium',
  questionCount: 10,
  customPrompt: '',
  seedStr: new Date().toISOString().split('T')[0],
  lang: storageService.getLanguage(),

  questions: [],
  currentIndex: 0,
  selectedOptionIndex: null,
  isCorrect: null,
  pointsEarned: 0,

  score: 0,
  streak: 0,
  highestStreak: 0,
  lives: 3,
  eloState: createInitialEloState(1200, 3),

  timeRemainingMs: 20000,
  timeLimitMs: 20000,
  questionStartTime: 0,

  userAnswers: [],
  aiSettings: storageService.getAISettings(),
  soundMuted: soundEngine.isMuted(),

  stats: storageService.getStats(),
  showAIModal: false,
  showStatsModal: false,
  generationError: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function updateState(updater: Partial<QuizStoreState> | ((prev: QuizStoreState) => QuizStoreState)) {
  if (typeof updater === 'function') {
    storeState = updater(storeState);
  } else {
    storeState = { ...storeState, ...updater };
  }
  notify();
}

export function getTimeLimitForQuestion(question: Question, mode: QuizMode): number {
  if (mode === 'blitz') return 10000; // 10 seconds for blitz mode
  return DEFAULT_TIME_LIMITS[question.difficulty] || 20000;
}

export const quizStore = {
  getSnapshot(): QuizStoreState {
    return storeState;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Actions
  setMode(mode: QuizMode) {
    updateState({ mode, generationError: null });
  },

  setCategory(category: Category | 'all') {
    updateState({ category });
  },

  setDifficulty(difficulty: Difficulty | 'dynamic') {
    updateState({ difficulty });
  },

  setQuestionCount(questionCount: number) {
    updateState({ questionCount });
  },

  setCustomPrompt(customPrompt: string) {
    updateState({ customPrompt });
  },

  setSeedStr(seedStr: string) {
    updateState({ seedStr });
  },

  setLanguage(lang: Language) {
    storageService.setLanguage(lang);
    updateState({ lang });
  },

  toggleSound() {
    const muted = soundEngine.toggleMute();
    updateState({ soundMuted: muted });
  },

  updateAISettings(settings: AISettings) {
    storageService.setAISettings(settings);
    updateState({ aiSettings: settings });
  },

  setShowAIModal(show: boolean) {
    updateState({ showAIModal: show });
  },

  setShowStatsModal(show: boolean) {
    updateState({ showStatsModal: show });
  },

  async startQuiz() {
    soundEngine.playClick();
    haptics.vibrateClick();

    const { mode, category, difficulty, questionCount, customPrompt, seedStr, aiSettings, lang } = storeState;

    updateState({
      gameState: 'GENERATING',
      generationError: null,
    });

    try {
      const qCount = mode === 'survival' ? 20 : mode === 'blitz' ? 10 : questionCount;
      const questions = await QuestionEngine.prepareQuestions({
        mode,
        category,
        difficulty,
        questionCount: qCount,
        customPrompt,
        seedStr,
        aiSettings,
        lang,
      });

      if (!questions || questions.length === 0) {
        throw new Error('No questions could be prepared.');
      }

      const firstQ = questions[0];
      const timeLimit = getTimeLimitForQuestion(firstQ, mode);

      updateState({
        questions,
        currentIndex: 0,
        selectedOptionIndex: null,
        isCorrect: null,
        pointsEarned: 0,
        score: 0,
        streak: 0,
        highestStreak: 0,
        lives: 3,
        eloState: createInitialEloState(1200, 3),
        timeLimitMs: timeLimit,
        timeRemainingMs: timeLimit,
        questionStartTime: Date.now(),
        userAnswers: [],
        gameState: 'ACTIVE',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      updateState({
        gameState: 'IDLE',
        generationError: msg,
      });
    }
  },

  selectOption(index: number) {
    if (storeState.gameState !== 'ACTIVE' || storeState.selectedOptionIndex !== null) return;
    soundEngine.playClick();
    haptics.vibrateClick();
    updateState({ selectedOptionIndex: index });
  },

  submitAnswer() {
    if (storeState.gameState !== 'ACTIVE' || storeState.selectedOptionIndex === null) return;

    const {
      questions,
      currentIndex,
      selectedOptionIndex,
      mode,
      timeLimitMs,
      questionStartTime,
      score,
      streak,
      highestStreak,
      eloState,
      userAnswers,
    } = storeState;

    const currentQ = questions[currentIndex];
    const timeSpentMs = Math.max(0, Date.now() - questionStartTime);
    const correct = selectedOptionIndex === currentQ.correctIndex;

    const scoreRes = calculateQuestionScore(
      correct,
      currentQ.difficulty,
      timeSpentMs,
      timeLimitMs,
      streak
    );

    let nextElo = eloState;
    if (mode === 'survival' || currentQ.baseElo) {
      const qElo = currentQ.baseElo || TIER_BASE_ELO[currentQ.difficulty];
      const { newState } = updateEloState(eloState, qElo, correct);
      nextElo = newState;
    }

    const newStreak = scoreRes.streak;
    const newHighestStreak = Math.max(highestStreak, newStreak);
    const newScore = score + scoreRes.finalScore;

    if (correct) {
      soundEngine.playCorrectChime();
      haptics.vibrateSuccess();
    } else {
      soundEngine.playWrongBuzz();
      haptics.vibrateFailure();
    }

    const newRecord: UserAnswerRecord = {
      question: currentQ,
      selectedIndex: selectedOptionIndex,
      isCorrect: correct,
      pointsEarned: scoreRes.finalScore,
      timeSpentMs,
    };

    updateState({
      isCorrect: correct,
      pointsEarned: scoreRes.finalScore,
      score: newScore,
      streak: newStreak,
      highestStreak: newHighestStreak,
      lives: nextElo.lives,
      eloState: nextElo,
      userAnswers: [...userAnswers, newRecord],
      gameState: 'REVEAL',
    });
  },

  handleTimeout() {
    if (storeState.gameState !== 'ACTIVE') return;

    const {
      questions,
      currentIndex,
      mode,
      timeLimitMs,
      score,
      highestStreak,
      eloState,
      userAnswers,
    } = storeState;

    const currentQ = questions[currentIndex];
    const timeSpentMs = timeLimitMs;
    const correct = false;

    const scoreRes = calculateQuestionScore(false, currentQ.difficulty, timeSpentMs, timeLimitMs, 0);

    let nextElo = eloState;
    if (mode === 'survival' || currentQ.baseElo) {
      const qElo = currentQ.baseElo || TIER_BASE_ELO[currentQ.difficulty];
      const { newState } = updateEloState(eloState, qElo, false);
      nextElo = newState;
    }

    soundEngine.playWrongBuzz();
    haptics.vibrateFailure();

    const newRecord: UserAnswerRecord = {
      question: currentQ,
      selectedIndex: null,
      isCorrect: false,
      pointsEarned: 0,
      timeSpentMs,
    };

    updateState({
      selectedOptionIndex: null,
      isCorrect: false,
      pointsEarned: 0,
      streak: 0,
      lives: nextElo.lives,
      eloState: nextElo,
      userAnswers: [...userAnswers, newRecord],
      gameState: 'REVEAL',
    });
  },

  nextQuestion() {
    soundEngine.playClick();
    haptics.vibrateClick();

    const { questions, currentIndex, mode, lives, userAnswers, score, highestStreak, category, difficulty } = storeState;

    // Check game over condition
    const isLastQuestion = currentIndex >= questions.length - 1;
    const isOutofLives = mode === 'survival' && lives <= 0;

    if (isLastQuestion || isOutofLives) {
      const correctCount = userAnswers.filter((a) => a.isCorrect).length;
      const totalQ = userAnswers.length;
      const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
      const xpEarned = Math.round(score * 0.5 + correctCount * 50 + highestStreak * 25);

      soundEngine.playVictoryFanfare();

      const categoryBreakdown: Record<string, { total: number; correct: number }> = {};
      userAnswers.forEach((ans) => {
        const cat = ans.question.category;
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0 };
        categoryBreakdown[cat].total += 1;
        if (ans.isCorrect) categoryBreakdown[cat].correct += 1;
      });

      const updatedStats = storageService.saveGameStats({
        score,
        totalQuestions: totalQ,
        correctCount,
        highestStreak,
        xpEarned,
        finalEloRating: mode === 'survival' ? storeState.eloState.playerRating : undefined,
        categoryBreakdown,
      });

      storageService.addHistoryEntry({
        mode,
        category,
        difficulty,
        score,
        totalQuestions: totalQ,
        correctCount,
        accuracy,
        highestStreak,
        xpEarned,
        finalEloRating: mode === 'survival' ? storeState.eloState.playerRating : undefined,
      });

      updateState({
        gameState: 'GAME_OVER',
        stats: updatedStats,
      });
      return;
    }

    const nextIndex = currentIndex + 1;
    const nextQ = questions[nextIndex];
    const timeLimit = getTimeLimitForQuestion(nextQ, mode);

    updateState({
      currentIndex: nextIndex,
      selectedOptionIndex: null,
      isCorrect: null,
      pointsEarned: 0,
      timeLimitMs: timeLimit,
      timeRemainingMs: timeLimit,
      questionStartTime: Date.now(),
      gameState: 'ACTIVE',
    });
  },

  goToReview() {
    soundEngine.playClick();
    haptics.vibrateClick();
    updateState({ gameState: 'REVIEW' });
  },

  exitToHome() {
    soundEngine.playClick();
    haptics.vibrateClick();
    updateState({
      gameState: 'IDLE',
      questions: [],
      currentIndex: 0,
      selectedOptionIndex: null,
      isCorrect: null,
      userAnswers: [],
    });
  },
};

export function useQuizStore(): QuizStoreState {
  return useSyncExternalStore(quizStore.subscribe, quizStore.getSnapshot);
}
