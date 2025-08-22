import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../models/question.model';
import { ReviewAnswer } from '../../models/review-answer.model';
import { QuestionUtils, StatisticsUtils } from '../../utils';

@Component({
    selector: 'app-review',
    templateUrl: './review.component.html',
    styleUrls: ['./review.component.scss'],
    standalone: false
})
export class ReviewComponent {
  @Input() question?: Question;
  @Input() answers: ReviewAnswer[] = [];
  @Input() hasNextQuestion = false;
  
  @Output() showLeaderboard = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();

  showCorrectAnswer = false;

  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getCorrectCount(): number {
    return StatisticsUtils.countMatching(this.answers, answer => answer.is_correct);
  }

  getAccuracyPercentage(): number {
    return StatisticsUtils.calculateAccuracyPercentage(this.getCorrectCount(), this.answers.length);
  }

  getCorrectOptionLetter(): string {
    return QuestionUtils.getCorrectOptionLetter(this.question || {});
  }

  toggleCorrectAnswer(): void {
    this.showCorrectAnswer = !this.showCorrectAnswer;
  }
}
