import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../models/question.model';

export interface ReviewAnswer {
  id: string;
  team_id: string;
  team_name: string;
  answer: string | string[];
  is_correct: boolean;
  points_awarded: number;
  submitted_at: string;
  time_taken?: number;
}

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent {
  @Input() question?: Question;
  @Input() answers: ReviewAnswer[] = [];
  @Input() hasNextQuestion = false;
  
  @Output() showLeaderboard = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();

  showCorrectAnswer = false;

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

  getCorrectCount(): number {
    return this.answers.filter(answer => answer.is_correct).length;
  }

  getAccuracyPercentage(): number {
    if (this.answers.length === 0) return 0;
    return Math.round((this.getCorrectCount() / this.answers.length) * 100);
  }

  getCorrectOptionLetter(): string {
    if (this.question?.type === 'multiple_choice' && this.question.options && this.question.correct_answer) {
      const index = this.question.options.indexOf(this.question.correct_answer);
      return index >= 0 ? String.fromCharCode(65 + index) : '';
    }
    return '';
  }

  toggleCorrectAnswer(): void {
    this.showCorrectAnswer = !this.showCorrectAnswer;
  }
}
