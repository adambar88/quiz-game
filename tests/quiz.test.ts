import { describe, it, expect } from 'vitest';
import {
  calculateQuestionScore,
  getStreakMultiplier,
  getTimeMultiplier,
  DEFAULT_BASE_POINTS,
} from '../src/algorithms/scoring.ts';

import {
  createInitialEloState,
  updateEloState,
  calculateExpectedScore,
} from '../src/algorithms/elo.ts';

import {
  hashStringTo32BitSeed,
  createMulberry32,
  createLCG,
  generateDailyChallenge,
} from '../src/algorithms/seedRng.ts';

import {
  getSystemPrompt,
  buildUserPrompt,
} from '../src/ai/prompts.ts';

import {
  validateAndParseAIResponse,
} from '../src/ai/validators.ts';

import { STATIC_QUESTION_BANK } from '../src/data/questions.ts';
import { QuestionEngine } from '../src/services/questionEngine.ts';
import { storageService } from '../src/services/storageService.ts';

describe('Speed-Decay & Streak Scoring Algorithm', () => {
  it('should verify base points per difficulty tier', () => {
    expect(DEFAULT_BASE_POINTS.easy).toBe(100);
    expect(DEFAULT_BASE_POINTS.medium).toBe(200);
    expect(DEFAULT_BASE_POINTS.hard).toBe(350);
    expect(DEFAULT_BASE_POINTS.expert).toBe(500);
  });

  it('should calculate streak multipliers correctly', () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
    expect(getStreakMultiplier(1)).toBe(1.1);
    expect(getStreakMultiplier(3)).toBe(1.5);
    expect(getStreakMultiplier(7)).toBe(3.0);
    expect(getStreakMultiplier(10)).toBe(3.0);
  });

  it('should calculate time decay multipliers correctly', () => {
    expect(getTimeMultiplier(0, 15000)).toBe(1.0);
    expect(getTimeMultiplier(15000, 15000)).toBe(0.2);
    expect(getTimeMultiplier(7500, 15000)).toBe(0.6);
  });

  it('should calculate full question scores', () => {
    const score1 = calculateQuestionScore(true, 'hard', 0, 20000, 2);
    expect(score1.finalScore).toBe(525);
    expect(score1.streak).toBe(3);

    const scoreWrong = calculateQuestionScore(false, 'hard', 2000, 20000, 5);
    expect(scoreWrong.finalScore).toBe(0);
    expect(scoreWrong.streak).toBe(0);
  });
});

describe('Dynamic Adaptive ELO Scaling Algorithm', () => {
  it('should initialize player ELO state', () => {
    const initialElo = createInitialEloState(1200, 3);
    expect(initialElo.playerRating).toBe(1200);
    expect(initialElo.tier).toBe('medium');
    expect(initialElo.lives).toBe(3);
  });

  it('should calculate expected score for equal ratings', () => {
    const exp = calculateExpectedScore(1200, 1200);
    expect(Math.abs(exp - 0.5)).toBeLessThan(0.0001);
  });

  it('should step UP tier after 3 consecutive correct answers', () => {
    let eloState = createInitialEloState(1200, 3);
    let update1 = updateEloState(eloState, 1400, true);
    eloState = update1.newState;
    expect(eloState.consecutiveCorrect).toBe(1);

    let update2 = updateEloState(eloState, 1400, true);
    eloState = update2.newState;
    expect(eloState.consecutiveCorrect).toBe(2);

    let update3 = updateEloState(eloState, 1400, true);
    eloState = update3.newState;
    expect(eloState.tier).toBe('hard');
    expect(update3.result.tierChanged).toBe(true);
  });

  it('should step DOWN tier and decrement life on wrong answer', () => {
    let eloState = createInitialEloState(1600, 3);
    let wrongUpdate = updateEloState(eloState, 1800, false);
    expect(wrongUpdate.newState.tier).toBe('medium');
    expect(wrongUpdate.newState.lives).toBe(2);
    expect(wrongUpdate.newState.consecutiveCorrect).toBe(0);
  });
});

describe('Deterministic Seed Hash & PRNG', () => {
  it('should produce deterministic 32-bit seeds from date strings', () => {
    const seed1 = hashStringTo32BitSeed('2026-08-12');
    const seed2 = hashStringTo32BitSeed('2026-08-12');
    const seedDiff = hashStringTo32BitSeed('2026-08-13');

    expect(seed1).toBe(seed2);
    expect(seed1).not.toBe(seedDiff);
  });

  it('should produce identical floats from Mulberry32 with same seed', () => {
    const seed = hashStringTo32BitSeed('2026-08-12');
    const mbRng1 = createMulberry32(seed);
    const mbRng2 = createMulberry32(seed);
    expect(mbRng1()).toBe(mbRng2());
  });

  it('should generate valid LCG numbers', () => {
    const seed = hashStringTo32BitSeed('2026-08-12');
    const lcgRng = createLCG(seed);
    const lcgVal = lcgRng();
    expect(lcgVal).toBeGreaterThanOrEqual(0);
    expect(lcgVal).toBeLessThan(1);
  });

  it('should generate deterministic daily challenges', () => {
    const challengeA = generateDailyChallenge('2026-08-12', STATIC_QUESTION_BANK, 5);
    const challengeB = generateDailyChallenge('2026-08-12', STATIC_QUESTION_BANK, 5);
    const challengeOther = generateDailyChallenge('2026-08-13', STATIC_QUESTION_BANK, 5);

    expect(challengeA.seedHex).toBe(challengeB.seedHex);
    expect(challengeA.questions.length).toBe(5);
    expect(challengeA.questions[0].id).toBe(challengeB.questions[0].id);
    expect(challengeA.questions[0].options[0]).toBe(challengeB.questions[0].options[0]);
    expect(challengeA.seedHex).not.toBe(challengeOther.seedHex);
  });
});

describe('AI Prompts & JSON Schema Validation', () => {
  it('should build provider system prompts and user prompts', () => {
    const serverPrompt = getSystemPrompt('server');
    expect(serverPrompt).toContain('JSON');

    const userPrompt = buildUserPrompt({ category: 'Computer Science', difficulty: 'hard', count: 5 });
    expect(userPrompt).toContain('Computer Science');
    expect(userPrompt).toContain('5');
  });

  it('should parse markdown wrapped JSON responses', () => {
    const mockMarkdownResponse = `
\`\`\`json
[
  {
    "category": "Science",
    "question": "What is the atomic number of Hydrogen?",
    "options": ["1", "2", "6", "8"],
    "correctIndex": 0,
    "explanation": "Hydrogen has a single proton in its nucleus, giving it atomic number 1.",
    "difficulty": "easy",
    "tags": ["chemistry", "elements"]
  }
]
\`\`\`
    `;

    const validationResult = validateAndParseAIResponse(mockMarkdownResponse);
    expect(validationResult.valid).toBe(true);
    expect(validationResult.questions.length).toBe(1);
    expect(validationResult.questions[0].question).toBe('What is the atomic number of Hydrogen?');
  });

  it('should sanitize JSON with trailing commas', () => {
    const mockTrailingComma = `[{"category":"Web Dev","question":"What does CSS stand for?","options":["Cascading Style Sheets","Creative Style System","Computer Style Sheet","Colorful Style Sheets"],"correctIndex":0,"explanation":"CSS stands for Cascading Style Sheets.","difficulty":"easy","tags":["css"],}]`;
    const cleanResult = validateAndParseAIResponse(mockTrailingComma);
    expect(cleanResult.valid).toBe(true);
  });

  it('should reject invalid schemas', () => {
    const mockInvalidSchema = `[{"question": "Short", "options": ["Only two"], "correctIndex": 5}]`;
    const invalidResult = validateAndParseAIResponse(mockInvalidSchema);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});

describe('Static Question Bank', () => {
  it('should contain 30+ valid questions covering 6 categories', () => {
    expect(STATIC_QUESTION_BANK.length).toBeGreaterThanOrEqual(30);

    const categories = Array.from(new Set(STATIC_QUESTION_BANK.map((q) => q.category)));
    expect(categories.length).toBeGreaterThanOrEqual(6);

    STATIC_QUESTION_BANK.forEach((q) => {
      expect(q.id).toBeTruthy();
      expect(q.category).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.explanation).toBeTruthy();
      expect(q.difficulty).toBeTruthy();
    });
  });
});

describe('QuestionEngine & Offline Fallback', () => {
  it('should select questions from static bank by category and difficulty', () => {
    const selected = QuestionEngine.selectFromStaticBank('Science', 'easy', 5);
    expect(selected.length).toBe(5);
    expect(selected.every((q) => q.category === 'Science' || q.difficulty === 'easy')).toBe(true);
  });

  it('should prepare questions for daily challenge mode synchronously', async () => {
    const questions = await QuestionEngine.prepareQuestions({
      mode: 'daily',
      category: 'all',
      difficulty: 'medium',
      questionCount: 5,
      seedStr: '2026-08-12',
      aiSettings: {
        activeProvider: 'server',
        serverEndpoint: '/quiz/api/ai',
        serverApiKey: '',
        serverModel: 'gpt-5-mini',
        fallbackToOffline: true,
      },
    });

    expect(questions.length).toBe(5);
  });
});

describe('Storage & Theme Management', () => {
  it('should return default AI settings and stats safely', () => {
    const aiSettings = storageService.getAISettings();
    expect(aiSettings.activeProvider).toBe('server');

    const stats = storageService.getStats();
    expect(stats.highestEloRating).toBe(1200);
  });
});

