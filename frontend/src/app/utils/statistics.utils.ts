/**
 * Utility functions for statistics and calculations
 */
export class StatisticsUtils {
  
  /**
   * Calculate accuracy percentage from correct/total counts
   */
  static calculateAccuracyPercentage(correctCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((correctCount / totalCount) * 100);
  }

  /**
   * Calculate average score from an array of numbers
   */
  static calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, score) => sum + score, 0);
    return total / scores.length;
  }

  /**
   * Find the highest score from an array of numbers
   */
  static findHighestScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return Math.max(...scores);
  }

  /**
   * Count items that match a predicate function
   */
  static countMatching<T>(items: T[], predicate: (item: T) => boolean): number {
    return items.filter(predicate).length;
  }

  /**
   * Calculate percentage with specified decimal places
   */
  static calculatePercentage(part: number, total: number, decimalPlaces = 0): number {
    if (total === 0) return 0;
    const percentage = (part / total) * 100;
    return Math.round(percentage * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }
}