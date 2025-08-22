import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../models/question.model';
import { ReviewAnswer } from '../../models/review-answer.model';

@Component({
  selector: 'app-review',
  template: `
    <div class="review-container" *ngIf="question">
      <!-- Question Header -->
      <div class="review-header">
        <div class="question-info">
          <h2>Question {{ question.question_number }} Review</h2>
          <div class="question-meta">
            <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
            <span class="points">{{ question.points }} points</span>
          </div>
        </div>
        
        <div class="review-stats">
          <div class="stat">
            <span class="stat-value">{{ answers.length }}</span>
            <span class="stat-label">Teams</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getCorrectCount() }}</span>
            <span class="stat-label">Correct</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getAccuracyPercentage() }}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
        </div>
      </div>

      <!-- Question Display -->
      <div class="question-display">
        <h3>{{ question.question_text }}</h3>
        
        <div class="fun-fact" *ngIf="question.fun_fact">
          <mat-icon>lightbulb</mat-icon>
          <p>{{ question.fun_fact }}</p>
        </div>

        <!-- Correct Answer Display -->
        <div class="correct-answer" *ngIf="showCorrectAnswer">
          <h4>Correct Answer:</h4>
          <div class="answer-content" [ngSwitch]="question.type">
            <!-- Multiple Choice -->
            <div *ngSwitchCase="'multiple_choice'" class="multiple-choice-answer">
              <div class="option correct">
                <span class="option-letter">{{ getCorrectOptionLetter() }}</span>
                <span class="option-text">{{ question.correct_answer }}</span>
                <mat-icon>check_circle</mat-icon>
              </div>
            </div>
            
            <!-- Open Text -->
            <div *ngSwitchCase="'open_text'" class="text-answer">
              <p>{{ question.correct_answer }}</p>
            </div>
            
            <!-- Sequence -->
            <div *ngSwitchCase="'sequence'" class="sequence-answer">
              <div class="sequence-items">
                <div class="sequence-item" *ngFor="let item of question.sequence_items; let i = index">
                  <span class="sequence-number">{{ i + 1 }}</span>
                  <span class="sequence-text">{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="review-actions">
        <button mat-raised-button (click)="toggleCorrectAnswer()">
          <mat-icon>{{ showCorrectAnswer ? 'visibility_off' : 'visibility' }}</mat-icon>
          {{ showCorrectAnswer ? 'Hide' : 'Show' }} Correct Answer
        </button>
        
        <button mat-raised-button color="primary" (click)="showLeaderboard.emit()">
          <mat-icon>leaderboard</mat-icon>
          Show Leaderboard
        </button>
        
        <button mat-raised-button color="accent" (click)="nextQuestion.emit()" *ngIf="hasNextQuestion">
          <mat-icon>skip_next</mat-icon>
          Next Question
        </button>
      </div>
    </div>
  `,
  styles: [`
    .review-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .question-info h2 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.8rem;
    }

    .question-meta {
      display: flex;
      gap: 16px;
    }

    .question-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .points {
      background: #f3e5f5;
      color: #7b1fa2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .review-stats {
      display: flex;
      gap: 24px;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #2196f3;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .question-display {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .question-display h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 1.4rem;
      line-height: 1.6;
    }

    .fun-fact {
      display: flex;
      gap: 12px;
      background: #fff8e1;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .fun-fact mat-icon {
      color: #ff9800;
      font-size: 24px;
      flex-shrink: 0;
    }

    .correct-answer {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
    }

    .correct-answer h4 {
      margin: 0 0 12px 0;
      color: #4caf50;
      font-size: 1.1rem;
    }

    .multiple-choice-answer .option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: #e8f5e8;
      border: 2px solid #4caf50;
      border-radius: 8px;
      color: #2e7d32;
    }

    .option-letter {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .text-answer p {
      background: #e8f5e8;
      color: #2e7d32;
      padding: 12px 16px;
      border-radius: 8px;
      border: 2px solid #4caf50;
      margin: 0;
    }

    .sequence-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sequence-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: #e8f5e8;
      border: 2px solid #4caf50;
      border-radius: 8px;
      color: #2e7d32;
    }

    .sequence-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .review-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .review-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .review-container {
        padding: 16px;
      }

      .review-header {
        flex-direction: column;
        gap: 16px;
      }

      .review-stats {
        align-self: stretch;
        justify-content: space-around;
      }

      .review-actions {
        flex-direction: column;
      }

      .review-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
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
