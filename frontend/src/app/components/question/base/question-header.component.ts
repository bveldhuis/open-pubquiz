import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../models/question.model';
import { QuestionUtils } from '../../../utils';

@Component({
  selector: 'app-question-header',
  template: `
    <div class="question-header">
      <div class="question-info">
        <div class="question-number">
          <h2>Question {{ question?.question_number || '?' }}</h2>
        </div>
        
        <!-- Progress bar moved here, below question title -->
        <div class="progress-section" *ngIf="showProgress && showTimer">
          <div class="progress-container">
            <div class="progress-bar" [style.width.%]="getProgressPercentage()"></div>
          </div>
        </div>
        
        <div class="question-meta">
          <span class="question-type-badge">{{ getQuestionTypeLabel(question?.type || '') }}</span>
          <span class="points">{{ question?.points || 0 }} point{{ (question?.points || 0) !== 1 ? 's' : '' }}</span>
        </div>
      </div>
      
      <div class="timer-section" *ngIf="showTimer">
        <app-question-timer 
          [timeRemaining]="timeRemaining"
          [totalTime]="totalTime"
          [showProgress]="false"
          (timeUp)="onTimeUp.emit()"
          (timeChanged)="onTimeChanged.emit($event)">
        </app-question-timer>
      </div>
    </div>
  `,
  styles: [`
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .question-info {
      flex: 1;
    }

    .question-number h2 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.8rem;
      font-weight: 700;
    }

    .question-meta {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .question-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .points {
      background: #f3e5f5;
      color: #7b1fa2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .timer-section {
      flex-shrink: 0;
    }

    .progress-section {
      margin: 12px 0;
    }

    .progress-container {
      width: 100%;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      transition: width 1s linear;
      border-radius: 3px;
    }

    @media (max-width: 768px) {
      .question-header {
        flex-direction: column;
        gap: 16px;
      }

      .question-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .timer-section {
        align-self: stretch;
      }
    }
  `]
})
export class QuestionHeaderComponent {
  @Input() question?: Question;
  @Input() showTimer = false;
  @Input() timeRemaining = 0;
  @Input() totalTime = 0;
  @Input() showProgress = true;
  
  @Output() onTimeUp = new EventEmitter<void>();
  @Output() onTimeChanged = new EventEmitter<number>();

  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getProgressPercentage(): number {
    if (this.totalTime === 0) return 100;
    return (this.timeRemaining / this.totalTime) * 100;
  }
}
