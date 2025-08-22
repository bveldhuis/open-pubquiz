import { Component, Input } from '@angular/core';
import { Question } from '../../../../models/question.model';
import { QuestionUtils } from '../../../../utils';

@Component({
  template: ''
})
export abstract class BaseQuestionComponent {
  @Input() question?: Question;
  @Input() timeRemaining = 0;

  // Delegate to utility functions for consistency
  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getOptionLetter(index: number): string {
    return QuestionUtils.getOptionLetter(index);
  }

  formatTime(seconds: number): string {
    return QuestionUtils.formatTime(seconds);
  }

  isTimeLow(): boolean {
    return QuestionUtils.isTimeLow(this.timeRemaining);
  }

  isTimeCritical(): boolean {
    return QuestionUtils.isTimeCritical(this.timeRemaining);
  }

  getTimerClasses(): string {
    return QuestionUtils.getTimerClasses(this.timeRemaining);
  }

  getCorrectOptionLetter(): string {
    return QuestionUtils.getCorrectOptionLetter(this.question || {});
  }
}
