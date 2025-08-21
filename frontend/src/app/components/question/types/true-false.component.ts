import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-true-false',
  template: `
    <div class="true-false-question">
      <div class="question-content">
        <p class="question-text">{{ question?.question_text }}</p>
        <div class="answer-options">
          <button 
            mat-raised-button 
            [class.selected]="currentAnswer === 'true'"
            [class.correct]="showCorrectAnswer && question?.correct_answer === 'true'"
            [class.incorrect]="showCorrectAnswer && currentAnswer === 'true' && question?.correct_answer !== 'true'"
            [disabled]="isDisabled"
            (click)="selectAnswer('true')">
            <mat-icon>check_circle</mat-icon>
            True
          </button>
          
          <button 
            mat-raised-button 
            [class.selected]="currentAnswer === 'false'"
            [class.correct]="showCorrectAnswer && question?.correct_answer === 'false'"
            [class.incorrect]="showCorrectAnswer && currentAnswer === 'false' && question?.correct_answer !== 'false'"
            [disabled]="isDisabled"
            (click)="selectAnswer('false')">
            <mat-icon>cancel</mat-icon>
            False
          </button>
        </div>
        <div class="question-info">
          <span class="points">Points: {{ question?.points || 0 }}</span>
          <span class="time-limit" *ngIf="question?.time_limit">Time: {{ question?.time_limit }}s</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .true-false-question {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .question-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .question-text {
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
      margin: 0;
    }

    .answer-options {
      display: flex;
      gap: 20px;
      justify-content: center;
    }

    .answer-options button {
      min-width: 120px;
      padding: 16px 24px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .answer-options button mat-icon {
      margin-right: 8px;
    }

    .answer-options button.selected {
      background: #2196f3;
      color: white;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    }

    .answer-options button.correct {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
    }

    .answer-options button.incorrect {
      background: #f44336;
      color: white;
      border-color: #f44336;
    }

    .question-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      color: #666;
    }

    .points {
      font-weight: 500;
      color: #3f51b5;
    }

    .time-limit {
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .answer-options {
        flex-direction: column;
        gap: 12px;
      }

      .answer-options button {
        width: 100%;
        min-width: auto;
      }
    }
  `]
})
export class TrueFalseComponent {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Input() showCorrectAnswer: boolean = false;
  @Output() answerSelected = new EventEmitter<string>();

  currentAnswer: string = '';

  selectAnswer(answer: string): void {
    if (!this.isDisabled) {
      this.currentAnswer = answer;
      this.answerSelected.emit(answer);
    }
  }
}
