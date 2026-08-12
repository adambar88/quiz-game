import type { Difficulty, ScoreConfig, ScoreResult } from '../types/quiz.ts';

/**
 * Default Base Points per Difficulty Tier
 */
export const DEFAULT_BASE_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 350,
  expert: 500,
};

/**
 * Default Scoring Configuration
 */
export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  basePoints: DEFAULT_BASE_POINTS,
  minTimeMultiplier: 0.2, // Minimum 20% speed credit for any correct answer within time limit
  decayGamma: 1.0,        // Linear time decay (gamma = 1.0)
  streakCap: 3.0,         // Maximum streak multiplier capped at 3.0x
};

/**
 * Calculate Streak Multiplier from current streak count (S >= 0).
 * Multiplier steps:
 *   S = 0: 1.0x
 *   S = 1: 1.1x
 *   S = 2: 1.25x
 *   S = 3: 1.5x
 *   S = 4: 1.8x
 *   S = 5: 2.2x
 *   S = 6: 2.6x
 *   S >= 7: 3.0x (Capped)
 */
export function getStreakMultiplier(streak: number, maxCap: number = 3.0): number {
  if (streak <= 0) return 1.0;
  
  const STREAK_TABLE: Record<number, number> = {
    1: 1.10,
    2: 1.25,
    3: 1.50,
    4: 1.80,
    5: 2.20,
    6: 2.60,
  };

  if (streak in STREAK_TABLE) {
    return Math.min(maxCap, STREAK_TABLE[streak]);
  }

  // For streak >= 7, cap at maxCap (default 3.0)
  return Math.min(maxCap, 3.0);
}

/**
 * Calculate Time Ratio Decay Multiplier F_time(t, T_max).
 * 
 * Formula:
 *   r = clamp(t / T_max, 0, 1)
 *   F_time(r) = max(F_min, 1.0 - (1.0 - F_min) * (r ^ gamma))
 * 
 * @param timeSpentMs Time spent by player in milliseconds
 * @param timeLimitMs Maximum allowed time in milliseconds
 * @param minTimeMultiplier Minimum time floor factor (default 0.2)
 * @param decayGamma Decay non-linearity exponent (default 1.0)
 */
export function getTimeMultiplier(
  timeSpentMs: number,
  timeLimitMs: number,
  minTimeMultiplier: number = 0.2,
  decayGamma: number = 1.0
): number {
  if (timeLimitMs <= 0) return 1.0;
  
  // Ratio r in [0, 1]
  const ratio = Math.max(0, Math.min(1, timeSpentMs / timeLimitMs));
  
  // Exponential / power decay
  const decayedRatio = Math.pow(ratio, decayGamma);
  
  // Calculate multiplier between 1.0 and minTimeMultiplier
  const multiplier = 1.0 - (1.0 - minTimeMultiplier) * decayedRatio;
  
  // Round to 4 decimal places for floating-point precision safety
  return Math.round(Math.max(minTimeMultiplier, Math.min(1.0, multiplier)) * 10000) / 10000;
}

/**
 * Calculate the complete score for a question response.
 * 
 * @param isCorrect Whether the player answered correctly
 * @param difficulty Difficulty tier of the question
 * @param timeSpentMs Response time in milliseconds
 * @param timeLimitMs Time limit in milliseconds
 * @param currentStreak Current streak count before this question
 * @param config Custom scoring parameters (optional)
 */
export function calculateQuestionScore(
  isCorrect: boolean,
  difficulty: Difficulty,
  timeSpentMs: number,
  timeLimitMs: number,
  currentStreak: number,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreResult {
  const timeSpentRatio = Math.max(0, Math.min(1, timeSpentMs / (timeLimitMs || 1)));

  if (!isCorrect) {
    return {
      isCorrect: false,
      basePoints: config.basePoints[difficulty],
      timeMultiplier: 0,
      streakMultiplier: 1.0,
      rawPoints: 0,
      finalScore: 0,
      streak: 0, // Reset streak on incorrect answer
      timeSpentRatio,
    };
  }

  const updatedStreak = currentStreak + 1;
  const basePoints = config.basePoints[difficulty];
  const timeMultiplier = getTimeMultiplier(
    timeSpentMs,
    timeLimitMs,
    config.minTimeMultiplier,
    config.decayGamma
  );
  const streakMultiplier = getStreakMultiplier(updatedStreak, config.streakCap);

  const rawPoints = basePoints * timeMultiplier * streakMultiplier;
  const finalScore = Math.round(rawPoints);

  return {
    isCorrect: true,
    basePoints,
    timeMultiplier,
    streakMultiplier,
    rawPoints,
    finalScore,
    streak: updatedStreak,
    timeSpentRatio,
  };
}
