import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-image',
  template: `
    <div class="image-question">
      <div class="image-container">
        <img 
          [src]="question?.media_url || ''"
          [alt]="question?.question_text || 'Question image'"
          class="question-image"
          (error)="onImageError($event)">
      </div>
      <div class="question-content">
        <p class="question-text">{{ question?.question_text }}</p>
        <div class="answer-input">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Answer</mat-label>
            <input 
              matInput 
              [(ngModel)]="currentAnswer" 
              placeholder="Enter your answer"
              [disabled]="isDisabled"
              (input)="onInputChange()">
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
    .image-question {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .image-container {
      text-align: center;
    }

    .question-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
export class ImageComponent {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Output() answerChange = new EventEmitter<string>();

  currentAnswer: string = '';

  onImageError(event: any): void {
    console.error('Image failed to load:', event);
  }

  onAnswerChange(): void {
    this.answerChange.emit(this.currentAnswer);
  }

  onInputChange(): void {
    this.onAnswerChange();
  }
}
