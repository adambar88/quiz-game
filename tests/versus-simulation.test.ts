import { describe, it, expect, beforeEach } from 'vitest';
import { quizStore, getQuestionsPerPick } from '../src/state/useQuizStore.ts';
import { peerService, PlayerState } from '../src/services/peerService.ts';
import { QuestionEngine } from '../src/services/questionEngine.ts';
import { STATIC_QUESTION_BANK } from '../src/data/questions.ts';

describe('Versus Race Mode - End-to-End Simulation & Bug Inspection', () => {
  beforeEach(() => {
    quizStore.exitToHome();
  });

  it('should correctly calculate questions per pick for 2 players (3 questions per pick)', () => {
    expect(getQuestionsPerPick(2)).toBe(3);
    expect(getQuestionsPerPick(3)).toBe(2);
    expect(getQuestionsPerPick(4)).toBe(1);
  });

  it('should initialize versus mode with custom player name and initial state', () => {
    quizStore.setMode('versus');
    quizStore.setVersusPlayerName('Adam');

    const state = quizStore.getSnapshot();
    expect(state.mode).toBe('versus');
    expect(state.versusPlayerName).toBe('Adam');
  });

  it('should correctly determine opponent completion status when opponent answers 3 questions', () => {
    const questions = STATIC_QUESTION_BANK.filter((q) => q.category === 'Computer Science').slice(0, 3);
    
    // Simulate opponent state after answering 3 out of 3 questions
    const opponentState: PlayerState = {
      id: 'guest_12345',
      name: 'Ewa',
      score: 450,
      streak: 3,
      lives: 3,
      currentIndex: 2, // 0-indexed 3rd question
      isFinished: false,
      accuracy: 100,
      answers: [
        { isCorrect: true, timeMs: 2000 },
        { isCorrect: true, timeMs: 1500 },
        { isCorrect: true, timeMs: 1800 },
      ],
    };

    // Calculate completion criteria as in VersusCategoryPickerModal
    const opponentAnsCount = opponentState.answers?.length ?? opponentState.currentIndex ?? 0;
    const isOpponentStillAnswering = Boolean(
      opponentState &&
      !opponentState.isFinished &&
      questions.length > 0 &&
      opponentAnsCount < questions.length
    );

    // 3 questions answered out of 3 questions -> isOpponentStillAnswering MUST be false!
    expect(opponentAnsCount).toBe(3);
    expect(questions.length).toBe(3);
    expect(isOpponentStillAnswering).toBe(false);
  });

  it('should advance rounds correctly up to 12 total questions across 4 picks', async () => {
    quizStore.setMode('versus');
    
    // Pick 1: Host picks Computer Science (3 questions)
    await quizStore.handleVersusCategoryChoice('Computer Science');
    
    let state = quizStore.getSnapshot();
    expect(state.questions.length).toBe(3);
    expect(state.versusPickIndex).toBe(1);
    expect(state.gameState).toBe('ACTIVE');

    // Host answers 3 questions
    for (let i = 0; i < 3; i++) {
      state = quizStore.getSnapshot();
      quizStore.selectOption(state.questions[i].correctIndex);
      quizStore.submitAnswer();
      quizStore.nextQuestion();
    }

    state = quizStore.getSnapshot();
    // After 3 questions, host should enter category picker for next pick
    expect(state.versusShowCategoryPicker).toBe(true);

    // Pick 2: Guest picks History (3 questions)
    await quizStore.handleVersusCategoryChoice('History');
    state = quizStore.getSnapshot();
    expect(state.questions.length).toBe(6);
    expect(state.versusPickIndex).toBe(2);

    // Host answers questions 3, 4, 5
    for (let i = 3; i < 6; i++) {
      state = quizStore.getSnapshot();
      quizStore.selectOption(state.questions[i].correctIndex);
      quizStore.submitAnswer();
      quizStore.nextQuestion();
    }

    state = quizStore.getSnapshot();
    expect(state.versusShowCategoryPicker).toBe(true);

    // Pick 3: Host picks Science (3 questions)
    await quizStore.handleVersusCategoryChoice('Science');
    state = quizStore.getSnapshot();
    expect(state.questions.length).toBe(9);

    for (let i = 6; i < 9; i++) {
      state = quizStore.getSnapshot();
      quizStore.selectOption(state.questions[i].correctIndex);
      quizStore.submitAnswer();
      quizStore.nextQuestion();
    }

    state = quizStore.getSnapshot();
    expect(state.versusShowCategoryPicker).toBe(true);

    // Pick 4: Guest picks Physics (3 questions) - Final pick reaching 12 questions
    await quizStore.handleVersusCategoryChoice('Physics & Astronomy');
    state = quizStore.getSnapshot();
    expect(state.questions.length).toBe(12);

    for (let i = 9; i < 12; i++) {
      state = quizStore.getSnapshot();
      quizStore.selectOption(state.questions[i].correctIndex);
      quizStore.submitAnswer();
      quizStore.nextQuestion();
    }

    state = quizStore.getSnapshot();
    // After 12th question, game should finish and enter GAME_OVER
    expect(state.gameState).toBe('GAME_OVER');
  });
});
