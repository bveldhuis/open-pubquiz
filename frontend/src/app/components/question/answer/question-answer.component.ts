import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Question } from '../../../models/question.model';
import { BaseQuestionComponent } from '../base/base-question.component';

@Component({
  selector: 'app-question-answer',
  template: `
    <div class="question-answer-container" *ngIf="question">
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
        [question]="question"
        [isInteractive]="true"
        [selectedAnswer]="selectedAnswer"
        [shuffledSequenceItems]="shuffledSequenceItems"
        [isAnswerSubmitted]="isAnswerSubmitted"
        (answerSelected)="onAnswerSelected($event)"
        (answerChanged)="onAnswerChanged($event)"
        (answerValid)="onAnswerValid($event)"
        (sequenceReordered)="onSequenceReordered($event)">
      </app-question-content>
      
      <app-answer-controls 
        [isActive]="isActive"
        [canSubmit]="canSubmit"
        [isAnswerSubmitted]="isAnswerSubmitted"
        [timeRemaining]="timeRemaining"
        [questionType]="question.type"
        (submitAnswer)="onSubmitAnswer()">
      </app-answer-controls>
    </div>
  `,
  styles: [`
    .question-answer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    @media (max-width: 768px) {
      .question-answer-container {
        padding: 16px;
      }
    }
  `]
})
export class QuestionAnswerComponent extends BaseQuestionComponent implements OnInit {
  @Input() isActive = false;
  @Input() isAnswerSubmitted = false;
  @Input() totalTime = 0;
  
  @Output() answerSubmitted = new EventEmitter<string | string[]>();
  @Output() onTimeUp = new EventEmitter<void>();
  @Output() onTimeChanged = new EventEmitter<number>();
  
  // Interactive state
  selectedAnswer?: string;
  shuffledSequenceItems: string[] = [];
  canSubmit = false;

  ngOnInit() {
    // Initialize shuffled items for sequence questions
    if (this.question?.type === 'sequence' && this.question.sequence_items) {
      this.shuffledSequenceItems = [...this.question.sequence_items];
      this.shuffleArray(this.shuffledSequenceItems);
    }
  }

  ngOnChanges() {
    this.updateCanSubmit();
  }

  onAnswerSelected(answer: string) {
    this.selectedAnswer = answer;
    this.updateCanSubmit();
  }

  onAnswerChanged(answer: string) {
    this.selectedAnswer = answer;
    this.updateCanSubmit();
  }

  onAnswerValid(isValid: boolean) {
    this.canSubmit = isValid;
  }

  onSequenceReordered(items: string[]) {
    this.shuffledSequenceItems = items;
    this.updateCanSubmit();
  }

  onSubmitAnswer() {
    const answer = this.getSubmittedAnswer();
    this.answerSubmitted.emit(answer);
  }

  private updateCanSubmit() {
    // If answer is already submitted, disable submit button
    if (this.isAnswerSubmitted) {
      this.canSubmit = false;
      return;
    }

    switch (this.question?.type) {
      case 'multiple_choice':
        this.canSubmit = !!this.selectedAnswer;
        break;
      case 'open_text':
        this.canSubmit = !!this.selectedAnswer && this.selectedAnswer.trim().length > 0;
        break;
      case 'sequence':
        this.canSubmit = this.shuffledSequenceItems.length > 0;
        break;
      default:
        this.canSubmit = false;
    }
  }

  private shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  getSubmittedAnswer(): string | string[] {
    switch (this.question?.type) {
      case 'multiple_choice':
      case 'open_text':
        return this.selectedAnswer || '';
      case 'sequence':
        return this.shuffledSequenceItems;
      default:
        return '';
    }
  }

  resetAnswer() {
    this.selectedAnswer = undefined;
    this.shuffledSequenceItems = [];
    this.canSubmit = false;
    
    if (this.question?.type === 'sequence' && this.question.sequence_items) {
      this.shuffledSequenceItems = [...this.question.sequence_items];
      this.shuffleArray(this.shuffledSequenceItems);
    }
  }
}
