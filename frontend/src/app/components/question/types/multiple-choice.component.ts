import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../models/question.model';
import { QuestionUtils } from '../../../utils';

@Component({
  selector: 'app-multiple-choice',
  template: `
    <div class="multiple-choice-container">
      <div class="options">
        <div 
          class="option" 
          *ngFor="let option of question?.options; let i = index"
          [class.selected]="isInteractive && selectedAnswer === option"
          [class.correct]="showCorrectAnswer && option === question?.correct_answer"
          [class.incorrect]="showCorrectAnswer && selectedAnswer === option && option !== question?.correct_answer"
          [class.disabled]="!isInteractive || isAnswerSubmitted"
          (click)="onOptionClick(option)">
          
          <div class="option-content">
            <span class="option-letter">{{ QuestionUtils.getOptionLetter(i) }}</span>
            <span class="option-text">{{ option }}</span>
          </div>
          
          <div class="option-status" *ngIf="showCorrectAnswer">
            <mat-icon *ngIf="option === question?.correct_answer" class="correct-icon">
              check_circle
            </mat-icon>
            <mat-icon *ngIf="selectedAnswer === option && option !== question?.correct_answer" class="incorrect-icon">
              cancel
            </mat-icon>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .multiple-choice-container {
      margin: 20px 0;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .option:hover:not(.disabled) {
      border-color: #2196f3;
      background: #f5f9ff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
    }

    .option.selected {
      border-color: #2196f3;
      background: #e3f2fd;
      color: #1976d2;
    }

    .option.correct {
      border-color: #4caf50;
      background: #e8f5e8;
      color: #2e7d32;
    }

    .option.incorrect {
      border-color: #f44336;
      background: #ffebee;
      color: #c62828;
    }

    .option.disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .option-letter {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #f5f5f5;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.9rem;
      color: #666;
      flex-shrink: 0;
    }

    .option.selected .option-letter {
      background: #2196f3;
      color: white;
    }

    .option.correct .option-letter {
      background: #4caf50;
      color: white;
    }

    .option.incorrect .option-letter {
      background: #f44336;
      color: white;
    }

    .option-text {
      font-size: 1rem;
      line-height: 1.5;
      flex: 1;
    }

    .option-status {
      display: flex;
      align-items: center;
      margin-left: 12px;
    }

    .correct-icon {
      color: #4caf50;
      font-size: 24px;
    }

    .incorrect-icon {
      color: #f44336;
      font-size: 24px;
    }

    @media (max-width: 768px) {
      .option {
        padding: 14px 16px;
      }

      .option-letter {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
      }

      .option-text {
        font-size: 0.95rem;
      }
    }
  `]
})
export class MultipleChoiceComponent {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() selectedAnswer?: string;
  @Input() showCorrectAnswer = false;
  @Input() isAnswerSubmitted = false;
  
  @Output() answerSelected = new EventEmitter<string>();

  // Expose utility class for template use
  QuestionUtils = QuestionUtils;

  onOptionClick(option: string) {
    if (this.isInteractive && !this.isAnswerSubmitted) {
      this.answerSelected.emit(option);
    }
  }
}
