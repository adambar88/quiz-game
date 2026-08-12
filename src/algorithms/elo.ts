import type { Difficulty, EloState, EloUpdateResult } from '../types/quiz.ts';

/**
 * Standard ELO Tier Default Rating Map
 */
export const TIER_BASE_ELO: Record<Difficulty, number> = {
  easy: 1000,
  medium: 1400,
  hard: 1800,
  expert: 2200,
};

/**
 * ELO Thresholds for Tier Determination
 */
export const TIER_BOUNDARIES: Array<{ tier: Difficulty; minElo: number; maxElo: number }> = [
  { tier: 'easy', minElo: 0, maxElo: 1199 },
  { tier: 'medium', minElo: 1200, maxElo: 1599 },
  { tier: 'hard', minElo: 1600, maxElo: 1999 },
  { tier: 'expert', minElo: 2000, maxElo: Infinity },
];

/**
 * Tier Order Array for Step-Up / Step-Down Transitions
 */
export const TIER_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/**
 * Calculate expected score for Player A vs Question B using ELO formula.
 * E_p = 1 / (1 + 10^((R_q - R_p) / 400))
 */
export function calculateExpectedScore(playerRating: number, questionRating: number): number {
  return 1 / (1 + Math.pow(10, (questionRating - playerRating) / 400));
}

/**
 * Map an ELO rating value to its corresponding difficulty tier.
 */
export function ratingToTier(rating: number): Difficulty {
  if (rating < 1200) return 'easy';
  if (rating < 1600) return 'medium';
  if (rating < 2000) return 'hard';
  return 'expert';
}

/**
 * Get adjacent difficulty tier based on direction.
 */
export function getNextTier(currentTier: Difficulty, direction: 'up' | 'down'): Difficulty {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (direction === 'up') {
    const nextIndex = Math.min(TIER_ORDER.length - 1, currentIndex + 1);
    return TIER_ORDER[nextIndex];
  } else {
    const prevIndex = Math.max(0, currentIndex - 1);
    return TIER_ORDER[prevIndex];
  }
}

/**
 * Create initial ELO state for a player starting a quiz session.
 */
export function createInitialEloState(initialRating: number = 1200, maxLives: number = 3): EloState {
  return {
    playerRating: initialRating,
    tier: ratingToTier(initialRating),
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    lives: maxLives,
    maxLives,
  };
}

/**
 * Dynamic Adaptive ELO Scaling Algorithm Update.
 * 
 * Logic:
 * 1. Calculates expected outcome E_p based on player rating and question rating.
 * 2. Updates player rating: R'_p = R_p + K * (S_p - E_p).
 * 3. Updates question rating: R'_q = R_q + K * (E_p - S_p).
 * 4. Applies streak rules:
 *    - 3 consecutive correct -> Step UP 1 difficulty tier.
 *    - 1 wrong -> Step DOWN 1 difficulty tier & decrement life by 1.
 * 5. Syncs tier with ELO boundaries if rating moves past boundaries.
 * 
 * @param state Current EloState
 * @param questionRating Question ELO rating (defaults to tier base rating if omitted)
 * @param isCorrect Whether the answer was correct (true/false)
 * @param kFactor ELO K-factor (default 32)
 */
export function updateEloState(
  state: EloState,
  questionRating: number,
  isCorrect: boolean,
  kFactor: number = 32
): { newState: EloState; result: EloUpdateResult } {
  const previousRating = state.playerRating;
  const previousTier = state.tier;
  const previousLives = state.lives;

  // Expected score for player
  const expectedScore = calculateExpectedScore(previousRating, questionRating);
  const actualOutcome = isCorrect ? 1 : 0;

  // Rating updates
  const playerRatingChange = Math.round(kFactor * (actualOutcome - expectedScore));
  const newPlayerRating = Math.max(100, previousRating + playerRatingChange);

  const questionRatingChange = Math.round(kFactor * (expectedScore - actualOutcome));
  const newQuestionRating = Math.max(100, questionRating + questionRatingChange);

  // Consecutive counters & Life decay
  let newConsecutiveCorrect = state.consecutiveCorrect;
  let newConsecutiveWrong = state.consecutiveWrong;
  let newLives = state.lives;
  let candidateTier = previousTier;
  let tierDirection: 'up' | 'down' | 'unchanged' = 'unchanged';

  if (isCorrect) {
    newConsecutiveCorrect += 1;
    newConsecutiveWrong = 0;

    // Transition Rule: 3 consecutive correct answers -> Step UP tier
    if (newConsecutiveCorrect >= 3) {
      const steppedTier = getNextTier(previousTier, 'up');
      if (steppedTier !== previousTier) {
        candidateTier = steppedTier;
        tierDirection = 'up';
      }
      newConsecutiveCorrect = 0; // Reset counter after step-up
    } else {
      // Check rating-based tier boundary shift
      const ratingTier = ratingToTier(newPlayerRating);
      if (TIER_ORDER.indexOf(ratingTier) > TIER_ORDER.indexOf(previousTier)) {
        candidateTier = ratingTier;
        tierDirection = 'up';
      }
    }
  } else {
    // Wrong answer processing
    newConsecutiveCorrect = 0;
    newConsecutiveWrong += 1;
    newLives = Math.max(0, state.lives - 1);

    // Transition Rule: 1 wrong answer -> Step DOWN tier
    const steppedTier = getNextTier(previousTier, 'down');
    if (steppedTier !== previousTier) {
      candidateTier = steppedTier;
      tierDirection = 'down';
    } else {
      const ratingTier = ratingToTier(newPlayerRating);
      if (TIER_ORDER.indexOf(ratingTier) < TIER_ORDER.indexOf(previousTier)) {
        candidateTier = ratingTier;
        tierDirection = 'down';
      }
    }
  }

  const tierChanged = candidateTier !== previousTier;
  const isGameOver = newLives === 0;

  const newState: EloState = {
    playerRating: newPlayerRating,
    tier: candidateTier,
    consecutiveCorrect: newConsecutiveCorrect,
    consecutiveWrong: newConsecutiveWrong,
    lives: newLives,
    maxLives: state.maxLives,
  };

  const result: EloUpdateResult = {
    previousRating,
    newRating: newPlayerRating,
    previousTier,
    newTier: candidateTier,
    expectedScore: Math.round(expectedScore * 10000) / 10000,
    playerRatingChange,
    questionRatingChange,
    newQuestionRating,
    previousLives,
    newLives,
    tierChanged,
    tierDirection,
    isGameOver,
  };

  return { newState, result };
}
