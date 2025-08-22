/**
 * Utility functions for question-related operations
 */
export class QuestionUtils {
  
  /**
   * Get the display label for question types
   */
  static getQuestionTypeLabel(type: string): string {
    const labels = {
      'multiple_choice': 'Multiple Choice',
      'open_text': 'Open Text',
      'sequence': 'Sequence',
      'true_false': 'True/False',
      'numerical': 'Numerical',
      'image': 'Image',
      'audio': 'Audio',
      'video': 'Video'
    };
    return labels[type as keyof typeof labels] || 'Unknown';
  }

  /**
   * Get option letter (A, B, C, D, etc.) for multiple choice questions
   */
  static getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A = 65 in ASCII
  }

  /**
   * Format time in MM:SS format
   */
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if time is running low (≤ 10 seconds)
   */
  static isTimeLow(timeRemaining: number): boolean {
    return timeRemaining <= 10;
  }

  /**
   * Check if time is critical (≤ 5 seconds)
   */
  static isTimeCritical(timeRemaining: number): boolean {
    return timeRemaining <= 5;
  }

  /**
   * Get CSS classes for timer based on time remaining
   */
  static getTimerClasses(timeRemaining: number): string {
    if (QuestionUtils.isTimeCritical(timeRemaining)) {
      return 'timer critical';
    } else if (QuestionUtils.isTimeLow(timeRemaining)) {
      return 'timer warning';
    }
    return 'timer';
  }

  /**
   * Get the correct option letter for a multiple choice question
   */
  static getCorrectOptionLetter(question: { options?: string[]; correct_answer?: string }): string {
    if (question.options && question.correct_answer) {
      const index = question.options.indexOf(question.correct_answer);
      return index >= 0 ? QuestionUtils.getOptionLetter(index) : '';
    }
    return '';
  }
}