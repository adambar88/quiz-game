import { useSyncExternalStore } from 'react';
import type { Category, Difficulty, EloState, Question } from '../types/quiz.ts';
import { calculateQuestionScore } from '../algorithms/scoring.ts';
import { createInitialEloState, TIER_BASE_ELO, updateEloState } from '../algorithms/elo.ts';
import { soundEngine } from '../services/soundEngine.ts';
import { haptics } from '../services/haptics.ts';
import { storageService, type AISettings, type QuizStats } from '../services/storageService.ts';
import { QuestionEngine } from '../services/questionEngine.ts';

import { translations, type Language } from '../i18n/translations.ts';

import { peerService, type PlayerState } from '../services/peerService.ts';

export type GameState = 'IDLE' | 'GENERATING' | 'ACTIVE' | 'REVEAL' | 'GAME_OVER' | 'REVIEW';
export type QuizMode = 'classic' | 'survival' | 'blitz' | 'custom' | 'daily' | 'versus';

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
  showVersusLobby: boolean;
  versusRound: number;
  versusPickIndex: number;
  versusShowCategoryPicker: boolean;
  versusPlayerName: string;
  versusPlayers: PlayerState[];
  versusOpponentState: PlayerState | null;
  generationError: string | null;
}

const DEFAULT_TIME_LIMITS: Record<Difficulty, number> = {
  easy: 15000,
  medium: 20000,
  hard: 20000,
  expert: 25000,
};

export const getQuestionsPerPick = (playerCount: number): number => {
  if (playerCount >= 4) return 1;
  if (playerCount === 3) return 2;
  return 3; // 2 players = 3 questions per pick!
};

function getInitialStoreState(): QuizStoreState {
  let lang: Language = 'pl';
  let aiSettings: AISettings = {
    activeProvider: 'server',
    serverEndpoint: '/quiz/api/ai',
    serverApiKey: '',
    serverModel: 'gpt-5-mini',
    fallbackToOffline: true,
  };
  let soundMuted = false;
  let stats: QuizStats = {
    gamesPlayed: 0,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    totalScore: 0,
    highestStreak: 0,
    highestEloRating: 1200,
    totalXp: 0,
    categoryStats: {},
  };
  let versusPlayerName = '';

  try { lang = storageService.getLanguage(); } catch (_) {}
  try { aiSettings = storageService.getAISettings(); } catch (_) {}
  try { soundMuted = soundEngine.isMuted(); } catch (_) {}
  try { stats = storageService.getStats(); } catch (_) {}
  try { versusPlayerName = storageService.getPlayerName() || ''; } catch (_) {}

  return {
    gameState: 'IDLE',
    mode: 'classic',
    category: 'all',
    difficulty: 'medium',
    questionCount: 10,
    customPrompt: '',
    seedStr: new Date().toISOString().split('T')[0],
    lang,

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
    aiSettings,
    soundMuted,

    stats,
    showAIModal: false,
    showStatsModal: false,
    showVersusLobby: false,
    versusRound: 1,
    versusPickIndex: 0,
    versusShowCategoryPicker: false,
    versusPlayerName,
    versusPlayers: [],
    versusOpponentState: null,
    generationError: null,
  };
}

let storeState: QuizStoreState = getInitialStoreState();

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

  setVersusPlayerName(name: string) {
    storageService.setPlayerName(name);
    peerService.setMyName(name);
    updateState({ versusPlayerName: name });
    if (storeState.mode === 'versus') {
      quizStore.sendVersusProgress();
    }
  },

  setShowVersusLobby(show: boolean) {
    updateState({ showVersusLobby: show });
  },

  showVersusGeneratingState(chosenCategory?: string) {
    updateState({
      category: (chosenCategory as any) || storeState.category,
      gameState: 'GENERATING',
      showVersusLobby: false,
      versusShowCategoryPicker: false,
      generationError: null,
    });
  },

  startVersusDuel() {
    updateState({
      mode: 'versus',
      versusRound: 1,
      versusPickIndex: 0,
      versusShowCategoryPicker: true,
      showVersusLobby: false,
      questions: [],
      currentIndex: 0,
      selectedOptionIndex: null,
      isCorrect: null,
      pointsEarned: 0,
      score: 0,
      streak: 0,
      highestStreak: 0,
      lives: 3,
      userAnswers: [],
    });

    if (peerService.getIsHost()) {
      peerService.sendMessage({ type: 'INIT_VERSUS', senderName: storeState.versusPlayerName });
    }

    // Register PeerJS listener for versus messages
    peerService.setCallbacks(undefined, (msg) => {
      // Sync opponent name and info from any incoming message
      const opName = msg.playerState?.name || msg.pickerName || msg.senderName;
      const opId = msg.playerState?.id || msg.pickerId || msg.senderId;
      if (opName && opId && opId !== peerService.getMyId()) {
        const existing = storeState.versusOpponentState;
        if (!existing || existing.name !== opName || existing.id !== opId) {
          updateState({
            versusOpponentState: {
              id: opId,
              name: opName,
              score: msg.playerState?.score ?? existing?.score ?? 0,
              streak: msg.playerState?.streak ?? existing?.streak ?? 0,
              lives: msg.playerState?.lives ?? existing?.lives ?? 3,
              currentIndex: msg.playerState?.currentIndex ?? existing?.currentIndex ?? 0,
              isFinished: msg.playerState?.isFinished ?? existing?.isFinished ?? false,
              accuracy: msg.playerState?.accuracy ?? existing?.accuracy ?? 0,
              answers: msg.playerState?.answers ?? existing?.answers ?? [],
            },
          });
        }
      }

      if (msg.type === 'PROGRESS_UPDATE' && msg.playerState) {
        const existing = storeState.versusPlayers.filter((p) => p.id !== msg.playerState!.id);
        updateState({
          versusPlayers: [...existing, msg.playerState!],
          versusOpponentState: msg.playerState,
        });
      } else if (msg.type === 'CATEGORY_PICK') {
        updateState({
          category: (msg.chosenCategory as any) || storeState.category,
          versusShowCategoryPicker: false,
          generationError: null,
        });
      } else if (msg.type === 'ROUND_QUESTIONS' && msg.questions) {
        // Deduplicate incoming questions by ID or text to prevent double-appends (e.g. WebRTC + BroadcastChannel)
        const safeQuestions = storeState.questions || [];
        const existingIds = new Set(safeQuestions.filter((q) => q && (q.id || q.question)).map((q) => q.id || q.question));
        const uniqueNew = (msg.questions || []).filter((q) => q && !existingIds.has(q.id || q.question));

        const newAll = uniqueNew.length > 0 ? [...safeQuestions, ...uniqueNew] : safeQuestions;
        const nextIdx = storeState.userAnswers.length;
        const curQ = newAll[nextIdx] || safeQuestions[storeState.currentIndex] || msg.questions[0];
        const tLimit = getTimeLimitForQuestion(curQ, 'versus');

        const isWaitingForNewRound =
          storeState.mode === 'versus' &&
          (storeState.gameState === 'IDLE' ||
            storeState.showVersusLobby ||
            storeState.versusShowCategoryPicker ||
            storeState.currentIndex < nextIdx ||
            storeState.gameState === 'GENERATING');

        updateState({
          questions: newAll,
          currentIndex: isWaitingForNewRound ? nextIdx : storeState.currentIndex,
          selectedOptionIndex: isWaitingForNewRound ? null : storeState.selectedOptionIndex,
          isCorrect: isWaitingForNewRound ? null : storeState.isCorrect,
          versusPickIndex: (msg.pickIndex ?? storeState.versusPickIndex) + 1,
          timeLimitMs: tLimit,
          timeRemainingMs: isWaitingForNewRound ? tLimit : storeState.timeRemainingMs,
          questionStartTime: isWaitingForNewRound ? Date.now() : storeState.questionStartTime,
          showVersusLobby: false,
          versusShowCategoryPicker: false,
          gameState: isWaitingForNewRound ? 'ACTIVE' : storeState.gameState,
        });
      }
    });

    // Send initial player progress so opponent gets custom player name immediately
    quizStore.sendVersusProgress();
  },

  async handleVersusCategoryChoice(chosenCategory: Category) {
    const { versusRound, versusPickIndex, difficulty, seedStr, aiSettings, lang } = storeState;
    const currentQuestions = storeState.questions;
    const playerCount = Math.max(2, peerService.getConnectedCount());
    const qCount = getQuestionsPerPick(playerCount);

    updateState({
      category: chosenCategory,
      gameState: 'GENERATING',
      versusShowCategoryPicker: false,
      generationError: null,
    });

    peerService.sendMessage({
      type: 'CATEGORY_PICK',
      roundIndex: versusRound,
      pickIndex: versusPickIndex,
      chosenCategory,
      pickerId: peerService.getMyId(),
      pickerName: storeState.versusPlayerName,
    });

    try {
      const newQuestions = await QuestionEngine.prepareQuestions({
        mode: 'versus',
        category: chosenCategory,
        difficulty,
        questionCount: qCount,
        seedStr: `${seedStr}_p${versusPickIndex}`,
        aiSettings,
        lang,
      });

      peerService.sendMessage({
        type: 'ROUND_QUESTIONS',
        roundIndex: versusRound,
        pickIndex: versusPickIndex,
        questions: newQuestions,
      });

      const existingIds = new Set(currentQuestions.map((q) => q.id || q.question));
      const uniqueNew = newQuestions.filter((q) => !existingIds.has(q.id || q.question));
      const updated = uniqueNew.length > 0 ? [...currentQuestions, ...uniqueNew] : currentQuestions;

      const nextIdx = storeState.userAnswers.length;
      const firstQ = updated[nextIdx] || newQuestions[0];
      const timeLimit = getTimeLimitForQuestion(firstQ, 'versus');

      updateState({
        questions: updated,
        currentIndex: nextIdx,
        selectedOptionIndex: null,
        isCorrect: null,
        versusPickIndex: versusPickIndex + 1,
        timeLimitMs: timeLimit,
        timeRemainingMs: timeLimit,
        questionStartTime: Date.now(),
        showVersusLobby: false,
        versusShowCategoryPicker: false,
        gameState: 'ACTIVE',
      });
    } catch (err) {
      updateState({
        gameState: 'IDLE',
        generationError: 'Nie udało się pobrać pytań dla wybranej kategorii.',
      });
    }
  },

  startQuizWithQuestions(questions: Question[]) {
    if (!questions || questions.length === 0) return;
    const updated = [...storeState.questions, ...questions];
    const firstQ = updated[storeState.currentIndex] || updated[0];
    const timeLimit = getTimeLimitForQuestion(firstQ, storeState.mode);

    // Register PeerJS listener for progress & round updates
    peerService.setCallbacks(undefined, (msg) => {
      if (msg.type === 'PROGRESS_UPDATE' && msg.playerState) {
        const existing = storeState.versusPlayers.filter((p) => p.id !== msg.playerState!.id);
        updateState({
          versusPlayers: [...existing, msg.playerState!],
          versusOpponentState: msg.playerState,
        });
      } else if (msg.type === 'CATEGORY_PICK') {
        updateState({
          category: (msg.chosenCategory as any) || storeState.category,
          versusShowCategoryPicker: false,
          generationError: null,
        });
      } else if (msg.type === 'ROUND_QUESTIONS' && msg.questions) {
        const safeQuestions = storeState.questions || [];
        const existingIds = new Set(safeQuestions.filter((q) => q && (q.id || q.question)).map((q) => q.id || q.question));
        const uniqueNew = (msg.questions || []).filter((q) => q && !existingIds.has(q.id || q.question));

        const newAll = uniqueNew.length > 0 ? [...safeQuestions, ...uniqueNew] : safeQuestions;
        const nextIdx = storeState.userAnswers.length;
        const curQ = newAll[nextIdx] || safeQuestions[storeState.currentIndex] || msg.questions[0];
        const tLimit = getTimeLimitForQuestion(curQ, 'versus');

        const isWaitingForNewRound =
          storeState.mode === 'versus' &&
          (storeState.gameState === 'IDLE' ||
            storeState.showVersusLobby ||
            storeState.versusShowCategoryPicker ||
            storeState.currentIndex < nextIdx ||
            storeState.gameState === 'GENERATING');

        updateState({
          questions: newAll,
          currentIndex: isWaitingForNewRound ? nextIdx : storeState.currentIndex,
          selectedOptionIndex: isWaitingForNewRound ? null : storeState.selectedOptionIndex,
          isCorrect: isWaitingForNewRound ? null : storeState.isCorrect,
          versusPickIndex: (msg.pickIndex ?? storeState.versusPickIndex) + 1,
          timeLimitMs: tLimit,
          timeRemainingMs: isWaitingForNewRound ? tLimit : storeState.timeRemainingMs,
          questionStartTime: isWaitingForNewRound ? Date.now() : storeState.questionStartTime,
          showVersusLobby: false,
          versusShowCategoryPicker: false,
          gameState: isWaitingForNewRound ? 'ACTIVE' : storeState.gameState,
        });
      }
    });

    updateState({
      questions: updated,
      timeLimitMs: timeLimit,
      timeRemainingMs: timeLimit,
      questionStartTime: Date.now(),
      gameState: 'ACTIVE',
      showVersusLobby: false,
      versusShowCategoryPicker: false,
    });
  },

  sendVersusProgress() {
    if (storeState.mode !== 'versus') return;
    const totalQ = storeState.userAnswers.length;
    const correctCount = storeState.userAnswers.filter((a) => a.isCorrect).length;
    const myState: PlayerState = {
      id: peerService.getMyId(),
      name: storeState.versusPlayerName || (peerService.getIsHost() ? 'Gracz 1' : 'Gracz 2'),
      score: storeState.score,
      streak: storeState.streak,
      lives: storeState.lives,
      currentIndex: Math.max(storeState.currentIndex, totalQ),
      isFinished: storeState.gameState === 'GAME_OVER',
      accuracy: totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0,
      answers: storeState.userAnswers.map((a) => ({ isCorrect: a.isCorrect, timeMs: a.timeSpentMs })),
    };

    const existing = storeState.versusPlayers.filter((p) => p.id !== myState.id);
    updateState({ versusPlayers: [...existing, myState] });

    peerService.sendMessage({ type: 'PROGRESS_UPDATE', playerState: myState });
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

      if (mode === 'versus') {
        peerService.sendMessage({ type: 'START_GAME', questions });
      }

      this.startQuizWithQuestions(questions);
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

    quizStore.sendVersusProgress();
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

    quizStore.sendVersusProgress();
  },

  nextQuestion() {
    soundEngine.playClick();
    haptics.vibrateClick();

    const { questions, currentIndex, mode, lives, userAnswers, score, highestStreak, category, difficulty } = storeState;

    if (mode === 'versus') {
      const answeredCount = userAnswers.length;
      if (answeredCount >= 12) {
        soundEngine.playVictoryFanfare();
        updateState({ gameState: 'GAME_OVER' });
        quizStore.sendVersusProgress();
        return;
      }

      const playerCount = Math.max(2, peerService.getConnectedCount());
      const questionsPerPick = getQuestionsPerPick(playerCount);

      // Check if we need to draft category for next pick
      if (answeredCount % questionsPerPick === 0 && questions.length < 12) {
        const nextPick = Math.floor(answeredCount / questionsPerPick);
        updateState({
          versusPickIndex: nextPick,
          versusRound: Math.floor(nextPick / playerCount) + 1,
          versusShowCategoryPicker: true,
        });
        quizStore.sendVersusProgress();
        return;
      }
    }

    // Check game over condition
    const isLastQuestion = mode !== 'versus' && currentIndex >= questions.length - 1;
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

    if (mode === 'versus') {
      quizStore.sendVersusProgress();
    }
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
