import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-answer-controls',
  template: `
    <div class="answer-controls">
      <div class="submit-section" *ngIf="isActive && !isAnswerSubmitted">
        <button 
          mat-raised-button 
          color="primary" 
          (click)="submitAnswer.emit()"
          [disabled]="!canSubmit"
          class="submit-button">
          <mat-icon>send</mat-icon>
          <span>Submit Answer</span>
        </button>
        
        <div class="submit-hint" *ngIf="!canSubmit">
          <mat-icon>info</mat-icon>
          <span>{{ getSubmitHint() }}</span>
        </div>
      </div>

      <div class="answer-status" *ngIf="isAnswerSubmitted">
        <div class="submitted-message">
          <mat-icon>check_circle</mat-icon>
          <div class="status-content">
            <h4>Answer Submitted!</h4>
            <p>Your answer has been submitted successfully.</p>
          </div>
        </div>
      </div>

      <div class="time-warning" *ngIf="isActive && timeRemaining <= 10 && timeRemaining > 0 && !isAnswerSubmitted">
        <mat-icon>warning</mat-icon>
        <span>Time is running out! Submit your answer quickly.</span>
      </div>

      <div class="time-up" *ngIf="isActive && timeRemaining === 0">
        <mat-icon>timer_off</mat-icon>
        <span>Time's up! Your answer has been automatically submitted.</span>
      </div>
    </div>
  `,
  styles: [`
    .answer-controls {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-top: 20px;
    }

    .submit-section {
      text-align: center;
    }

    .submit-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      font-size: 1.1rem;
      font-weight: 600;
      min-width: 200px;
      margin: 0 auto;
    }

    .submit-button mat-icon {
      font-size: 24px;
    }

    .submit-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: #fff3cd;
      color: #856404;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .submit-hint mat-icon {
      font-size: 18px;
    }

    .answer-status {
      text-align: center;
    }

    .submitted-message {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #d4edda;
      color: #155724;
      border-radius: 12px;
      border: 1px solid #c3e6cb;
    }

    .submitted-message mat-icon {
      font-size: 32px;
      color: #28a745;
      flex-shrink: 0;
    }

    .status-content h4 {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .status-content p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .time-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 16px;
      background: #fff3cd;
      color: #856404;
      border-radius: 8px;
      font-weight: 500;
      animation: pulse 1s infinite;
    }

    .time-warning mat-icon {
      color: #ffc107;
      font-size: 20px;
    }

    .time-up {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 16px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 8px;
      font-weight: 500;
    }

    .time-up mat-icon {
      color: #dc3545;
      font-size: 20px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    @media (max-width: 768px) {
      .answer-controls {
        padding: 16px;
      }

      .submit-button {
        width: 100%;
        justify-content: center;
        padding: 14px 24px;
        font-size: 1rem;
      }

      .submitted-message {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }

      .submitted-message mat-icon {
        font-size: 28px;
      }
    }
  `]
})
export class AnswerControlsComponent {
  @Input() isActive = false;
  @Input() canSubmit = false;
  @Input() isAnswerSubmitted = false;
  @Input() timeRemaining = 0;
  @Input() questionType = '';
  
  @Output() submitAnswer = new EventEmitter<void>();

  getSubmitHint(): string {
    switch (this.questionType) {
      case 'multiple_choice':
        return 'Please select an answer before submitting.';
      case 'open_text':
        return 'Please enter your answer before submitting.';
      case 'sequence':
        return 'Please arrange the items in order before submitting.';
      default:
        return 'Please provide an answer before submitting.';
    }
  }
}
