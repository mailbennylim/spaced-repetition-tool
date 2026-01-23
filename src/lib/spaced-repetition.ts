/**
 * SM-2 Algorithm for Spaced Repetition
 * Based on SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality scale (0-5):
 * 5 - perfect response
 * 4 - correct response after a hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; where the correct one seemed easy to recall
 * 1 - incorrect response; the correct one remembered
 * 0 - complete blackout
 */

export interface ReviewResult {
  interval: number; // days
  repetitions: number;
  easeFactor: number;
}

export function calculateNextReview(
  quality: number, // 0-5 quality rating
  currentInterval: number,
  currentRepetitions: number,
  currentEaseFactor: number
): ReviewResult {
  // Quality must be between 0-5
  const normalizedQuality = Math.max(0, Math.min(5, quality));

  // Calculate new ease factor
  let newEaseFactor = currentEaseFactor + (0.1 - (5 - normalizedQuality) * (0.08 + (5 - normalizedQuality) * 0.02));

  // Ease factor should not be less than 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  let newInterval: number;
  let newRepetitions: number;

  // If quality < 3, restart the repetition process
  if (normalizedQuality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = currentRepetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  }

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
  };
}

export function getNextReviewDate(intervalDays: number): Date {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  nextDate.setHours(9, 0, 0, 0); // Default to 9 AM
  return nextDate;
}

export function isReviewDue(scheduledFor: Date): boolean {
  const now = new Date();
  return scheduledFor <= now;
}

export function getQualityDescription(quality: number): string {
  switch (quality) {
    case 5:
      return 'Perfect recall';
    case 4:
      return 'Correct after hesitation';
    case 3:
      return 'Correct with difficulty';
    case 2:
      return 'Incorrect but familiar';
    case 1:
      return 'Incorrect but remembered';
    case 0:
      return 'Complete blackout';
    default:
      return 'Unknown';
  }
}
