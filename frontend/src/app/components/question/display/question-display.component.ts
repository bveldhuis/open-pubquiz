import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Question } from '../../../models/question.model';
import { BaseQuestionComponent } from '../base/base-question.component';

@Component({
  selector: 'app-question-display',
  animations: [
    trigger('questionAnimation', [
      state('hide', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      state('show', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hide => show', [
        animate('0.5s ease-out')
      ]),
      transition('show => hide', [
        animate('0.3s ease-in')
      ])
    ])
  ],
  template: `
    <div class="question-display-container" *ngIf="question">
      <app-question-header 
        [question]="question"
        [showTimer]="isActive"
        [timeRemaining]="timeRemaining"
        [totalTime]="totalTime"
        [showProgress]="true"
        (onTimeUp)="onTimeUp.emit()"
        (onTimeChanged)="onTimeChanged.emit($event)">
      </app-question-header>
      
      <app-question-content 
        *ngIf="isActive || showCorrectAnswer"
        [question]="question"
        [showCorrectAnswer]="showCorrectAnswer"
        [isInteractive]="false"
        [isPresenter]="true"
        [isActive]="isActive"
        [@questionAnimation]="isActive ? 'show' : 'hide'">
      </app-question-content>
      
      <!-- Show fun fact when question is not active -->
      <div class="fun-fact-preview" *ngIf="!isActive && !showCorrectAnswer && question?.fun_fact">
        <div class="fun-fact-content">
          <mat-icon>lightbulb</mat-icon>
          <div class="fun-fact-text">
            <h4>Did you know?</h4>
            <p>{{ question.fun_fact }}</p>
          </div>
        </div>
      </div>
      
      <!-- Show placeholder when question is not active and no fun fact -->
      <div class="question-placeholder" *ngIf="!isActive && !showCorrectAnswer && !question?.fun_fact">
        <div class="placeholder-content">
          <mat-icon>visibility_off</mat-icon>
          <h3>Question Hidden</h3>
          <p>Question will be displayed when the presenter starts it.</p>
        </div>
      </div>
      
      <app-presenter-controls 
        *ngIf="showControls"
        [isActive]="isActive"
        [canStart]="canStart"
        [hasAnswers]="hasAnswers"
        [submissionsReceived]="submissionsReceived"
        [totalTeams]="totalTeams"
        (endQuestion)="endQuestion.emit()">
      </app-presenter-controls>
    </div>
  `,
  styles: [`
    .question-display-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .fun-fact-preview {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .fun-fact-content {
      display: flex;
      gap: 12px;
      background: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 8px;
      padding: 16px;
    }

    .fun-fact-content mat-icon {
      color: #4caf50;
      font-size: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .fun-fact-text h4 {
      margin: 0 0 4px 0;
      color: #2e7d32;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .fun-fact-text p {
      margin: 0;
      color: #388e3c;
      font-size: 0.95rem;
      line-height: 1.5;
      font-style: italic;
    }

    .question-placeholder {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
      text-align: center;
    }

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .placeholder-content mat-icon {
      font-size: 48px;
      color: #ccc;
      width: 48px;
      height: 48px;
    }

    .placeholder-content h3 {
      margin: 0;
      color: #666;
      font-size: 1.4rem;
      font-weight: 600;
    }

    .placeholder-content p {
      margin: 0;
      color: #999;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .question-display-container {
        padding: 16px;
      }
      
      .question-placeholder {
        padding: 30px 20px;
      }
      
      .placeholder-content mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
      
      .placeholder-content h3 {
        font-size: 1.2rem;
      }
    }
  `]
})
export class QuestionDisplayComponent extends BaseQuestionComponent {
  @Input() isActive = false;
  @Input() showCorrectAnswer = false;
  @Input() canStart = true;
  @Input() hasAnswers = false;
  @Input() submissionsReceived = 0;
  @Input() totalTeams = 0;
  @Input() totalTime = 0;
  @Input() showControls = true;
  @Input() isLastQuestion = false;
  
  @Output() startQuestion = new EventEmitter<void>();
  @Output() endQuestion = new EventEmitter<void>();
  @Output() showReview = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() endRound = new EventEmitter<void>();
  @Output() onTimeUp = new EventEmitter<void>();
  @Output() onTimeChanged = new EventEmitter<number>();
}
