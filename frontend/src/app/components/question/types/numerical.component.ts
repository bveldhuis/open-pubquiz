import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-numerical',
  template: `
    <div class="numerical-question">
      <div class="question-content">
        <p class="question-text">{{ question?.question_text }}</p>
        <div class="numerical-info" *ngIf="question?.numerical_tolerance">
          <span>Tolerance: ±{{ question?.numerical_tolerance }}</span>
        </div>
        <div class="answer-input">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Answer</mat-label>
            <input 
              matInput 
              type="number"
              [(ngModel)]="currentAnswer" 
              placeholder="Enter a number"
              [disabled]="isDisabled"
              (input)="onInputChange()">
            <mat-hint *ngIf="question?.numerical_tolerance">
              Tolerance: ±{{ question?.numerical_tolerance }}
            </mat-hint>
          </mat-form-field>
        </div>
        <div class="question-info">
          <span class="points">Points: {{ question?.points || 0 }}</span>
          <span class="time-limit" *ngIf="question?.time_limit">Time: {{ question?.time_limit }}s</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .numerical-question {
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

    .numerical-info {
      background: #e3f2fd;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #1976d2;
      border-left: 4px solid #2196f3;
    }

    .answer-input {
      width: 100%;
    }

    .full-width {
      width: 100%;
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
  `]
})
export class NumericalComponent {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Output() answerChange = new EventEmitter<string>();

  currentAnswer: string = '';

  onAnswerChange(): void {
    this.answerChange.emit(this.currentAnswer);
  }

  onInputChange(): void {
    this.onAnswerChange();
  }
}
