/**
 * Types definition for Quiz Application Core Data Structures and Algorithms.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type Category =
  | 'Computer Science'
  | 'Web Dev'
  | 'AI & Machine Learning'
  | 'Cybersecurity'
  | 'Gaming & Esports'
  | 'Science'
  | 'Physics & Astronomy'
  | 'Mathematics'
  | 'Geography & Earth'
  | 'Medicine & Health'
  | 'History'
  | 'Polish History'
  | 'Mythology & Folklore'
  | 'Politics & Civics'
  | 'Philosophy & Psychology'
  | 'Pop Culture'
  | 'Cinema & Television'
  | 'Music'
  | 'Literature & Books'
  | 'Art & Architecture'
  | 'Sports'
  | 'Food & Culinary'
  | 'Business & Finance'
  | 'Automotive & Transport';

export interface Question {
  id: string;
  category: Category;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, or 3
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
  baseElo?: number;
}

export interface AnswerSubmission {
  questionId: string;
  selectedIndex: number;
  timeSpentMs: number;
  timeLimitMs: number;
}

export interface ScoreConfig {
  basePoints: Record<Difficulty, number>;
  minTimeMultiplier: number; // e.g. 0.2 (20% floor)
  decayGamma: number; // time decay non-linearity factor (default 1.0 for linear)
  streakCap: number; // maximum multiplier cap, e.g. 3.0
}

export interface ScoreResult {
  isCorrect: boolean;
  basePoints: number;
  timeMultiplier: number;
  streakMultiplier: number;
  rawPoints: number;
  finalScore: number;
  streak: number;
  timeSpentRatio: number;
}

export interface EloState {
  playerRating: number;
  tier: Difficulty;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  lives: number;
  maxLives: number;
}

export interface EloUpdateResult {
  previousRating: number;
  newRating: number;
  previousTier: Difficulty;
  newTier: Difficulty;
  expectedScore: number;
  playerRatingChange: number;
  questionRatingChange: number;
  newQuestionRating: number;
  previousLives: number;
  newLives: number;
  tierChanged: boolean;
  tierDirection: 'up' | 'down' | 'unchanged';
  isGameOver: boolean;
}

export interface DailyChallengeConfig {
  date: string; // YYYY-MM-DD format
  topic?: string;
  questionCount: number;
  seed: number;
}

export interface DailyChallengeSession {
  date: string;
  seedHex: string;
  seedInt: number;
  questions: Question[];
}

export type AIProvider = 'server';

export interface AIQuestionPromptParams {
  category: Category;
  difficulty: Difficulty;
  count: number;
  topicFocus?: string;
  lang?: 'pl' | 'en';
}

export interface AIValidationResult {
  valid: boolean;
  questions: Question[];
  errors: string[];
  rawCleanedJson?: string;
}
