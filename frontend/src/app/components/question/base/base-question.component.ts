import { Component, Input } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  template: ''
})
export abstract class BaseQuestionComponent {
  @Input() question?: Question;
  @Input() timeRemaining = 0;

  /**
   * Get the display label for question types
   */
  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'open_text':
        return 'Open Text';
      case 'sequence':
        return 'Sequence';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get option letter (A, B, C, D, etc.)
   */
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A = 65 in ASCII
  }

  /**
   * Format time in MM:SS format
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if time is running low (≤ 10 seconds)
   */
  isTimeLow(): boolean {
    return this.timeRemaining <= 10;
  }

  /**
   * Check if time is critical (≤ 5 seconds)
   */
  isTimeCritical(): boolean {
    return this.timeRemaining <= 5;
  }

  /**
   * Get CSS classes for timer based on time remaining
   */
  getTimerClasses(): string {
    if (this.isTimeCritical()) {
      return 'timer critical';
    } else if (this.isTimeLow()) {
      return 'timer warning';
    }
    return 'timer';
  }
}
