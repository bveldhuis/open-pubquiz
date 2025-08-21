import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-presenter-controls',
  template: `
    <div class="presenter-controls">
      <div class="submissions-info" *ngIf="isActive">
        <div class="submissions-counter">
          <mat-icon>group</mat-icon>
          <span class="counter-text">{{ submissionsReceived }} / {{ totalTeams }} teams answered</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="getSubmissionPercentage()"></div>
        </div>
      </div>

      <div class="control-buttons">
        <button 
          mat-raised-button 
          color="warn" 
          *ngIf="isActive"
          (click)="endQuestion.emit()"
          class="control-button">
          <mat-icon>stop</mat-icon>
          <span>End Question</span>
        </button>
      </div>

      <div class="question-status" *ngIf="!isActive">
        <div class="status-indicator" [class]="getStatusClass()">
          <mat-icon>{{ getStatusIcon() }}</mat-icon>
          <span>{{ getStatusText() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .presenter-controls {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .submissions-info {
      margin-bottom: 20px;
    }

    .submissions-counter {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .submissions-counter mat-icon {
      color: #2196f3;
      font-size: 20px;
    }

    .counter-text {
      font-weight: 500;
      color: #333;
      font-size: 0.95rem;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2196f3, #21cbf3);
      transition: width 0.3s ease;
      border-radius: 3px;
    }

    .control-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .control-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-weight: 500;
      min-width: 140px;
    }

    .control-button mat-icon {
      font-size: 20px;
    }

    .question-status {
      border-top: 1px solid #e0e0e0;
      padding-top: 16px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .status-indicator.ready {
      color: #4caf50;
    }

    .status-indicator.waiting {
      color: #ff9800;
    }

    .status-indicator.completed {
      color: #2196f3;
    }

    .status-indicator mat-icon {
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .presenter-controls {
        padding: 16px;
      }

      .control-buttons {
        flex-direction: column;
        gap: 8px;
      }

      .control-button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PresenterControlsComponent {
  @Input() isActive = false;
  @Input() canStart = true;
  @Input() hasAnswers = false;
  @Input() submissionsReceived = 0;
  @Input() totalTeams = 0;
  
  @Output() endQuestion = new EventEmitter<void>();

  getSubmissionPercentage(): number {
    if (this.totalTeams === 0) return 0;
    return (this.submissionsReceived / this.totalTeams) * 100;
  }

  getStatusClass(): string {
    if (this.isActive) return 'waiting';
    if (this.hasAnswers) return 'completed';
    return 'ready';
  }

  getStatusIcon(): string {
    if (this.isActive) return 'schedule';
    if (this.hasAnswers) return 'check_circle';
    return 'radio_button_unchecked';
  }

  getStatusText(): string {
    if (this.isActive) return 'Question in progress';
    if (this.hasAnswers) return 'Answers received';
    return 'Ready to start';
  }
}
