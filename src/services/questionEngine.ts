import type { Category, Difficulty, Question } from '../types/quiz.ts';
import { generateDailyChallenge } from '../algorithms/seedRng.ts';
import { getStaticQuestionBank } from '../data/questions.ts';
import { generateQuestions } from './aiProvider.ts';
import type { AISettings } from './storageService.ts';

export interface QuizConfig {
  mode: 'classic' | 'survival' | 'blitz' | 'custom' | 'daily' | 'versus';
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
    const targetDifficulty: Difficulty = difficulty === 'dynamic' ? 'medium' : difficulty;

    try {
      const aiQuestions = await generateQuestions(
        {
          category: category,
          difficulty: targetDifficulty,
          count: questionCount,
          topicFocus: customPrompt,
          lang: currentLang,
        },
        aiSettings
      );

      const ensuredAi = aiQuestions.map((q) => ({
        ...q,
        category: category !== 'all' ? category : q.category,
      }));

      if (onProgress) onProgress(ensuredAi.length, questionCount);
      return ensuredAi;
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
    const usedIndices = new Set<number>();

    for (let i = 0; i < count; i++) {
      let chosenIndex = i % pool.length;
      for (let attempt = 0; attempt < pool.length; attempt++) {
        const candidate = (i + attempt) % pool.length;
        if (!usedIndices.has(candidate)) {
          chosenIndex = candidate;
          usedIndices.add(candidate);
          break;
        }
      }

      const item = pool[chosenIndex];

      let options: [string, string, string, string] = [...item.options];
      let correctIndex = item.correctIndex;

      if (usedIndices.size >= pool.length && i >= pool.length) {
        const correctText = options[correctIndex];
        const shuffled = [...options].sort(() => Math.random() - 0.5) as [string, string, string, string];
        correctIndex = shuffled.indexOf(correctText);
        options = shuffled;
      }

      selected.push({
        ...item,
        id: `static-${item.id}-${i}-${Math.floor(Math.random() * 10000)}`,
        category: category !== 'all' ? category : item.category,
        options,
        correctIndex,
      });
    }

    return selected;
  }
}
