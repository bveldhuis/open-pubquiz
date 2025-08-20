import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Question } from '../../services/quiz-management.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-question-display',
  template: `
    <div class="question-display" *ngIf="question">
      <div class="question-header">
        <div class="question-info">
          <h2>Question {{ question.question_number }}</h2>
          <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
          <span class="points">{{ question.points }} point{{ question.points !== 1 ? 's' : '' }}</span>
        </div>
        
        <div class="timer-section" *ngIf="isActive">
          <div class="timer" [class.warning]="timeRemaining <= 10">
            <mat-icon>timer</mat-icon>
            <span>{{ formatTime(timeRemaining) }}</span>
          </div>
        </div>
      </div>

      <div class="question-content">
        <div class="question-text">
          <h3>{{ question.question_text }}</h3>
        </div>

        <div class="fun-fact" *ngIf="question.fun_fact">
          <mat-icon>lightbulb</mat-icon>
          <p>{{ question.fun_fact }}</p>
        </div>

        <!-- Multiple Choice Options -->
        <div class="options" *ngIf="question.type === 'multiple_choice' && question.options">
          <div class="option" *ngFor="let option of question.options; let i = index">
            <span class="option-letter">{{ getOptionLetter(i) }}</span>
            <span class="option-text">{{ option }}</span>
            <mat-icon class="correct-answer" *ngIf="showCorrectAnswer && option === question.correct_answer">
              check_circle
            </mat-icon>
          </div>
        </div>

        <!-- Sequence Items -->
        <div class="sequence-items" *ngIf="question.type === 'sequence' && question.sequence_items">
          <div class="sequence-item" *ngFor="let item of question.sequence_items; let i = index">
            <span class="sequence-number">{{ i + 1 }}</span>
            <span class="sequence-text">{{ item }}</span>
          </div>
        </div>

        <!-- Correct Answer Display -->
        <div class="correct-answer-display" *ngIf="showCorrectAnswer && question.correct_answer">
          <h4>Correct Answer:</h4>
          <p class="answer">{{ question.correct_answer }}</p>
        </div>
      </div>

      <div class="question-controls">
        <div class="submissions-info" *ngIf="isActive">
          <mat-icon>group</mat-icon>
          <span>{{ submissionsReceived }} / {{ totalTeams }} teams answered</span>
        </div>

        <div class="control-buttons">
          <button 
            mat-raised-button 
            color="primary" 
            *ngIf="!isActive"
            (click)="startQuestion.emit(question.id)"
            [disabled]="!canStart">
            <mat-icon>play_arrow</mat-icon>
            Start Question
          </button>

          <button 
            mat-raised-button 
            color="warn" 
            *ngIf="isActive"
            (click)="endQuestion.emit()">
            <mat-icon>stop</mat-icon>
            End Question
          </button>

          <button 
            mat-raised-button 
            color="accent" 
            *ngIf="!isActive && hasAnswers"
            (click)="showReview.emit(question.id)">
            <mat-icon>visibility</mat-icon>
            Show Review
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .question-display {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
    }

    .question-info h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 1.8rem;
    }

    .question-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      margin-right: 10px;
    }

    .points {
      background: #4caf50;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .timer-section {
      text-align: center;
    }

    .timer {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f5f5f5;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .timer.warning {
      background: #ffebee;
      color: #d32f2f;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .question-content {
      margin-bottom: 30px;
    }

    .question-text h3 {
      font-size: 1.4rem;
      color: #333;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .fun-fact {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff3e0;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #ff9800;
    }

    .fun-fact mat-icon {
      color: #ff9800;
      margin-top: 2px;
    }

    .fun-fact p {
      margin: 0;
      color: #e65100;
      font-style: italic;
      font-size: 0.95rem;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 20px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .option:hover {
      border-color: #e3f2fd;
      background: #f3f8ff;
    }

    .option-letter {
      background: #3f51b5;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .option-text {
      flex: 1;
      font-size: 1rem;
    }

    .correct-answer {
      color: #4caf50;
    }

    .sequence-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    .sequence-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .sequence-number {
      background: #ff9800;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .sequence-text {
      flex: 1;
    }

    .correct-answer-display {
      margin-top: 20px;
      padding: 15px;
      background: #e8f5e8;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .correct-answer-display h4 {
      margin: 0 0 10px 0;
      color: #2e7d32;
    }

    .answer {
      margin: 0;
      font-weight: bold;
      color: #1b5e20;
      font-size: 1.1rem;
    }

    .question-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .submissions-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.9rem;
    }

    .control-buttons {
      display: flex;
      gap: 10px;
    }

    .control-buttons button {
      padding: 10px 20px;
    }

    .control-buttons mat-icon {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .question-display {
        padding: 20px;
      }

      .question-header {
        flex-direction: column;
        gap: 15px;
      }

      .question-controls {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }

      .control-buttons {
        justify-content: center;
      }
    }
  `]
})
export class QuestionDisplayComponent implements OnInit, OnDestroy {
  @Input() question?: Question;
  @Input() isActive = false;
  @Input() showCorrectAnswer = false;
  @Input() submissionsReceived = 0;
  @Input() totalTeams = 0;
  @Input() canStart = true;
  @Input() hasAnswers = false;

  @Output() startQuestion = new EventEmitter<string>();
  @Output() endQuestion = new EventEmitter<void>();
  @Output() showReview = new EventEmitter<string>();

  timeRemaining = 0;
  private timerSubscription?: Subscription;

  ngOnInit() {
    if (this.question?.time_limit) {
      this.timeRemaining = this.question.time_limit;
    }
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  getQuestionTypeLabel(type: string): string {
    const labels = {
      'multiple_choice': 'Multiple Choice',
      'open_text': 'Open Text',
      'sequence': 'Sequence'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
