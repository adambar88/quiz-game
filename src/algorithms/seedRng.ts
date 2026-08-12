import type { Question } from '../types/quiz.ts';

/**
 * FNV-1a 32-bit Hash Function for Date Strings.
 * Converts a string (e.g. "2026-08-12" or "2026-08-12:science") into a 32-bit unsigned integer seed.
 */
export function hashStringTo32BitSeed(input: string): number {
  let hash = 0x811c9dc5; // 32-bit FNV offset basis (2166136261)
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiply by 32-bit FNV prime (16777619) using 32-bit integer multiplication
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Return unsigned 32-bit integer
}

/**
 * Mulberry32 Pseudo-Random Number Generator.
 * Returns a function that produces deterministic pseudo-random floats in range [0, 1).
 */
export function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Linear Congruential Generator (LCG) PRNG (Knuth parameters).
 * Formula: X_{n+1} = (1664525 * X_n + 1013904223) mod 2^32
 */
export function createLCG(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Fisher-Yates Shuffle using a deterministic PRNG function.
 * Shuffles an array in place or returns a shuffled copy deterministically.
 */
export function seededShuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Deterministically shuffles a question's 4 options and updates the correctIndex.
 */
export function shuffleQuestionOptions(question: Question, prng: () => number): Question {
  const originalOptions = [...question.options];
  const correctOptionText = originalOptions[question.correctIndex];
  
  // Create indices array [0, 1, 2, 3] and shuffle
  const indices = [0, 1, 2, 3];
  const shuffledIndices = seededShuffle(indices, prng);

  const newOptions: [string, string, string, string] = [
    originalOptions[shuffledIndices[0]],
    originalOptions[shuffledIndices[1]],
    originalOptions[shuffledIndices[2]],
    originalOptions[shuffledIndices[3]],
  ];

  const newCorrectIndex = newOptions.indexOf(correctOptionText);

  return {
    ...question,
    options: newOptions,
    correctIndex: newCorrectIndex,
  };
}

/**
 * Deterministically select and order daily challenge questions.
 * 
 * @param dateStr Date string in format "YYYY-MM-DD" (e.g. "2026-08-12")
 * @param questionBank Full array of available questions
 * @param count Number of questions to select (default 10)
 * @param prngType Algorithm selection: 'mulberry32' (default) or 'lcg'
 * @param topic Optional category filter
 */
export function generateDailyChallenge(
  dateStr: string,
  questionBank: Question[],
  count: number = 10,
  prngType: 'mulberry32' | 'lcg' = 'mulberry32',
  topic?: string
): { date: string; seedHex: string; seedInt: number; questions: Question[] } {
  const compositeSeedString = topic ? `${dateStr}:${topic.toLowerCase()}` : dateStr;
  const seedInt = hashStringTo32BitSeed(compositeSeedString);
  const seedHex = '0x' + seedInt.toString(16).padStart(8, '0');

  const prng = prngType === 'mulberry32' ? createMulberry32(seedInt) : createLCG(seedInt);

  // Filter by topic if specified
  let candidatePool = questionBank;
  if (topic) {
    candidatePool = questionBank.filter(
      (q) => q.category.toLowerCase() === topic.toLowerCase()
    );
    if (candidatePool.length === 0) {
      candidatePool = questionBank; // Fallback if no questions match
    }
  }

  // Deep clone candidate questions
  const poolClone: Question[] = candidatePool.map((q) => ({
    ...q,
    options: [...q.options] as [string, string, string, string],
    tags: [...q.tags],
  }));

  // Shuffle question order
  const shuffledPool = seededShuffle(poolClone, prng);

  // Take requested count
  const selectedQuestions = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

  // Deterministically shuffle options within each question
  const finalQuestions = selectedQuestions.map((q) => shuffleQuestionOptions(q, prng));

  return {
    date: dateStr,
    seedHex,
    seedInt,
    questions: finalQuestions,
  };
}
