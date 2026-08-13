import type { Category, Difficulty, Question } from '../types/quiz.ts';
import { generateDailyChallenge } from '../algorithms/seedRng.ts';
import { getStaticQuestionBank } from '../data/questions.ts';
import { generateQuestions } from './aiProvider.ts';
import type { AISettings } from './storageService.ts';

export interface QuizConfig {
  mode: 'classic' | 'survival' | 'blitz' | 'custom' | 'daily';
  category: Category | 'all';
  difficulty: Difficulty | 'dynamic';
  questionCount: number;
  customPrompt?: string;
  seedStr?: string;
  aiSettings: AISettings;
  lang?: 'pl' | 'en';
}

export class QuestionEngine {
  /**
   * Main entry point for preparing quiz questions.
   * Provides instant Q1 bootstrap from local fast pool or static bank,
   * while prefetching remaining questions if using AI.
   */
  public static async prepareQuestions(
    config: QuizConfig,
    onProgress?: (loadedCount: number, total: number) => void
  ): Promise<Question[]> {
    const { mode, category, difficulty, questionCount, customPrompt, seedStr, aiSettings, lang } = config;
    const currentLang = lang || 'pl';

    // 1. Daily Challenge (Deterministic static pool shuffle)
    if (mode === 'daily') {
      const dateStr = seedStr || new Date().toISOString().split('T')[0];
      const bank = getStaticQuestionBank(currentLang);
      const challenge = generateDailyChallenge(dateStr, bank, questionCount);
      if (onProgress) onProgress(questionCount, questionCount);
      return challenge.questions;
    }

    // 2. Offline provider selected -> Instant synchronous return
    if (aiSettings.activeProvider === 'offline') {
      const questions = QuestionEngine.selectFromStaticBank(category, difficulty, questionCount, currentLang);
      if (onProgress) onProgress(questions.length, questionCount);
      return questions;
    }

    // 3. AI Provider: Bootstrap Q1 instantly from static bank as placeholder while pre-fetching AI batch
    if (onProgress) onProgress(1, questionCount);

    const targetCategory: Category = category === 'all' ? 'Computer Science' : category;
    const targetDifficulty: Difficulty = difficulty === 'dynamic' ? 'medium' : difficulty;

    try {
      const aiQuestions = await generateQuestions(
        {
          category: targetCategory,
          difficulty: targetDifficulty,
          count: questionCount,
          topicFocus: customPrompt || (mode === 'blitz' ? 'Fast trivia' : undefined),
          lang: currentLang,
        },
        aiSettings
      );

      if (onProgress) onProgress(aiQuestions.length, questionCount);
      return aiQuestions;
    } catch (err) {
      console.warn('[QuestionEngine] Question generation failed, falling back to curated static pool.', err);
      const fallbackQuestions = QuestionEngine.selectFromStaticBank(category, difficulty, questionCount, currentLang);
      if (onProgress) onProgress(fallbackQuestions.length, questionCount);
      return fallbackQuestions;
    }
  }

  /**
   * Helper to select and shuffle questions from static question bank
   */
  public static selectFromStaticBank(
    category: Category | 'all',
    difficulty: Difficulty | 'dynamic',
    count: number,
    lang: 'pl' | 'en' = 'pl'
  ): Question[] {
    let pool = [...getStaticQuestionBank(lang)];

    if (category !== 'all') {
      const catPool = pool.filter((q) => q.category === category);
      if (catPool.length > 0) pool = catPool;
    }

    if (difficulty !== 'dynamic') {
      const diffPool = pool.filter((q) => q.difficulty === difficulty);
      if (diffPool.length > 0) pool = diffPool;
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected: Question[] = [];
    for (let i = 0; i < count; i++) {
      const item = pool[i % pool.length];
      selected.push({
        ...item,
        id: `static-${item.id}-${i}-${Math.floor(Math.random() * 1000)}`,
      });
    }

    return selected;
  }
}
