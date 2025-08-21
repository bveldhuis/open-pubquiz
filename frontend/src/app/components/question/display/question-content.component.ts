import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-question-content',
  template: `
    <div class="question-content">
      <div class="question-text">
        <h3>{{ question?.question_text }}</h3>
      </div>

      <!-- Multiple Choice -->
      <app-multiple-choice 
        *ngIf="question?.type === 'multiple_choice'"
        [question]="question"
        [isInteractive]="isInteractive"
        [selectedAnswer]="selectedAnswer"
        [showCorrectAnswer]="showCorrectAnswer"
        [isAnswerSubmitted]="isAnswerSubmitted"
        (answerSelected)="answerSelected.emit($event)">
      </app-multiple-choice>

      <!-- Open Text -->
      <app-open-text 
        *ngIf="question?.type === 'open_text'"
        [question]="question"
        [isInteractive]="isInteractive"
        [isAnswerSubmitted]="isAnswerSubmitted"
        [showPreview]="showPreview"
        (answerChanged)="answerChanged.emit($event)"
        (answerValid)="answerValid.emit($event)">
      </app-open-text>

      <!-- Sequence -->
      <app-sequence 
        *ngIf="question?.type === 'sequence'"
        [question]="question"
        [isInteractive]="isInteractive"
        [shuffledItems]="shuffledSequenceItems || []"
        [showCorrectAnswer]="showCorrectAnswer"
        [isAnswerSubmitted]="isAnswerSubmitted"
        (sequenceReordered)="sequenceReordered.emit($event)">
      </app-sequence>

      <!-- True/False -->
      <app-true-false 
        *ngIf="question?.type === 'true_false'"
        [question]="question"
        [isDisabled]="!isInteractive || isAnswerSubmitted"
        [showCorrectAnswer]="showCorrectAnswer"
        (answerSelected)="answerSelected.emit($event)">
      </app-true-false>

      <!-- Numerical -->
      <app-numerical 
        *ngIf="question?.type === 'numerical'"
        [question]="question"
        [isDisabled]="!isInteractive || isAnswerSubmitted"
        (answerChange)="answerChanged.emit($event)">
      </app-numerical>

      <!-- Image -->
      <app-image 
        *ngIf="question?.type === 'image'"
        [question]="question"
        [isDisabled]="!isInteractive || isAnswerSubmitted"
        (answerChange)="answerChanged.emit($event)">
      </app-image>

      <!-- Audio -->
      <app-audio 
        *ngIf="question?.type === 'audio'"
        [question]="question"
        [isDisabled]="!isInteractive || isAnswerSubmitted"
        [isPresenter]="isPresenter"
        [isActive]="isActive"
        (answerChange)="answerChanged.emit($event)">
      </app-audio>

      <!-- Video -->
      <app-video 
        *ngIf="question?.type === 'video'"
        [question]="question"
        [isDisabled]="!isInteractive || isAnswerSubmitted"
        [isPresenter]="isPresenter"
        [isActive]="isActive"
        (answerChange)="answerChanged.emit($event)">
      </app-video>
    </div>
  `,
  styles: [`
    .question-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .question-text {
      margin-bottom: 24px;
    }

    .question-text h3 {
      margin: 0;
      color: #333;
      font-size: 1.4rem;
      line-height: 1.6;
      font-weight: 600;
    }

    .fun-fact {
      display: flex;
      gap: 12px;
      background: #fff8e1;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .fun-fact mat-icon {
      color: #ff9800;
      font-size: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .fun-fact-content h4 {
      margin: 0 0 4px 0;
      color: #e65100;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .fun-fact-content p {
      margin: 0;
      color: #795548;
      font-size: 0.95rem;
      line-height: 1.5;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .question-content {
        padding: 20px;
      }

      .question-text h3 {
        font-size: 1.2rem;
      }

      .fun-fact {
        padding: 14px;
        gap: 10px;
      }

      .fun-fact mat-icon {
        font-size: 20px;
      }
    }
  `]
})
export class QuestionContentComponent {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() selectedAnswer?: string;
  @Input() shuffledSequenceItems?: string[];
  @Input() showCorrectAnswer = false;
  @Input() isAnswerSubmitted = false;
  @Input() showPreview = false;
  @Input() isPresenter = false;
  @Input() isActive = false;
  
  @Output() answerSelected = new EventEmitter<string>();
  @Output() answerChanged = new EventEmitter<string>();
  @Output() answerValid = new EventEmitter<boolean>();
  @Output() sequenceReordered = new EventEmitter<string[]>();
}
