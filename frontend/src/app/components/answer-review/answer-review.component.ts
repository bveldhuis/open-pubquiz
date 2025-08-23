import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { LoadingStateComponent } from '../shared/loading-state/loading-state.component';
import { NoContentStateComponent } from '../shared/no-content-state/no-content-state.component';
import { Question } from '../../models/question.model';
import { Answer } from '../../models/answer.model';
import { SequenceAnswer } from '../../models/sequence-answer.model';
import { QuestionUtils } from '../../utils';

@Component({
    selector: 'app-answer-review',
    templateUrl: './answer-review.component.html',
    styleUrls: ['./answer-review.component.scss'],
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        LoadingStateComponent,
        NoContentStateComponent
    ]
})
export class AnswerReviewComponent {
  @Input() question?: Question;
  @Input() answers: Answer[] = [];
  @Input() isLastQuestion = false;
  @Input() isLoading = false;

  @Output() scoreAnswer = new EventEmitter<{ answerId: string; points: number; isCorrect: boolean }>();
  @Output() showLeaderboard = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();

  // Manual scoring state
  editingAnswerId: string | null = null;
  editingPoints = 0;

  readonly hasUnscoredAnswers = false;

  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getOptionLetter(index: number): string {
    return QuestionUtils.getOptionLetter(index);
  }

  onScoreAnswer(answerId: string, points: number, isCorrect: boolean) {
    this.scoreAnswer.emit({ answerId, points, isCorrect });
  }

  onScorePartial(answerId: string) {
    // For partial scoring, award half points
    const points = Math.ceil((this.question?.points || 1) / 2);
    this.scoreAnswer.emit({ answerId, points, isCorrect: true });
  }

  startManualScore(answer: Answer) {
    this.editingAnswerId = answer.id;
    this.editingPoints = answer.points_awarded;
  }

  saveManualScore(answerId: string) {
    if (this.editingPoints < 0) {
      this.editingPoints = 0;
    }
    if (this.editingPoints > (this.question?.points || 0)) {
      this.editingPoints = this.question?.points || 0;
    }

    // Determine if the answer is correct based on points
    const isCorrect = this.editingPoints > 0;
    
    this.scoreAnswer.emit({ 
      answerId, 
      points: this.editingPoints, 
      isCorrect 
    });
    
    this.cancelManualScore();
  }

  cancelManualScore() {
    this.editingAnswerId = null;
    this.editingPoints = 0;
  }

  getSequenceResultText(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'Not scored';
    }
    
    if (answer.points_awarded === this.question?.points) {
      return 'Perfect - All correct';
    } else if (answer.points_awarded === 1) {
      return 'Partial - 1 wrong';
    } else {
      return 'Incorrect';
    }
  }

  getSequenceAnswerText(answer: Answer): string {
    if (answer.sequenceAnswers && answer.sequenceAnswers.length > 0) {
      return answer.sequenceAnswers
        .sort((a: SequenceAnswer, b: SequenceAnswer) => a.position - b.position)
        .map((sa: SequenceAnswer) => sa.item_text)
        .join(' → ');
    }
    // Fallback to answer_text if sequenceAnswers not available
    return answer.answer_text.replace(/\|/g, ' → ');
  }

  isAutoScoredQuestion(): boolean {
    if (!this.question) return false;
    
    // Always auto-scored question types
    const alwaysAutoScoredTypes = ['multiple_choice', 'true_false', 'numerical'];
    
    // Question types that require a correct answer to be auto-scored
    const conditionalAutoScoredTypes = ['open_text', 'image', 'audio', 'video'];
    
    // Sequence questions require sequence_items to be auto-scored
    if (this.question.type === 'sequence') {
      return !!this.question.sequence_items && this.question.sequence_items.length > 0;
    }
    
    // Check conditional auto-scored types
    if (conditionalAutoScoredTypes.includes(this.question.type)) {
      return !!this.question.correct_answer;
    }
    
    return alwaysAutoScoredTypes.includes(this.question.type);
  }

  getAutoScoreResultText(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'Not scored';
    }
    
    // Special handling for sequence questions which can have partial scoring
    if (this.question?.type === 'sequence') {
      if (answer.points_awarded === this.question.points) {
        return `Perfect - All correct (${answer.points_awarded} pts)`;
      } else if (answer.points_awarded === 1) {
        return `Partial - 1 wrong (${answer.points_awarded} pt)`;
      } else {
        return 'Incorrect (0 pts)';
      }
    }
    
    // For all other question types
    if (answer.is_correct) {
      return `Correct (${answer.points_awarded} pts)`;
    } else {
      return 'Incorrect (0 pts)';
    }
  }

  getFormattedCorrectAnswer(): string {
    // For numerical questions, show the numerical answer with tolerance
    if (this.question?.type === 'numerical' && this.question.numerical_answer !== null && this.question.numerical_answer !== undefined) {
      const tolerance = this.question.numerical_tolerance ? ` (±${this.question.numerical_tolerance})` : '';
      return `${this.question.numerical_answer}${tolerance}`;
    }
    
    // For sequence questions, format the sequence
    if (this.question?.type === 'sequence' && this.question.sequence_items) {
      return this.question.sequence_items.join(' → ');
    }
    
    // For multiple choice, show the correct option
    if (this.question?.type === 'multiple_choice' && this.question.options) {
      const correctIndex = this.question.options.findIndex(option => 
        option === this.question?.correct_answer
      );
      if (correctIndex >= 0) {
        return `${QuestionUtils.getOptionLetter(correctIndex)}. ${this.question.correct_answer}`;
      }
    }
    
    return this.question?.correct_answer || '';
  }

  getAnswerStatus(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'unscored';
    }
    return answer.is_correct ? 'correct' : 'incorrect';
  }

  getAnswerStatusIcon(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'help_outline';
    }
    return answer.is_correct ? 'check_circle' : 'cancel';
  }

  getAnswerStatusColor(answer: Answer): string {
    if (answer.is_correct === null || answer.is_correct === undefined) {
      return 'warn';
    }
    return answer.is_correct ? 'primary' : 'accent';
  }

  getAnswerPointsText(answer: Answer): string {
    if (answer.points_awarded === null || answer.points_awarded === undefined) {
      return 'Not scored';
    }
    return `${answer.points_awarded} / ${this.question?.points || 0} points`;
  }

  getAnswerText(answer: Answer): string {
    // For sequence questions, format the sequence
    if (this.question?.type === 'sequence') {
      return this.getSequenceAnswerText(answer);
    }
    
    // For other question types, return the answer text
    return answer.answer_text;
  }

  onNextQuestion() {
    this.nextQuestion.emit();
  }

  onShowLeaderboard() {
    this.showLeaderboard.emit();
  }
}
