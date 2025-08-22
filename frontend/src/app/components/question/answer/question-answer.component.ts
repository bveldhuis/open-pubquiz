import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Question } from '../../../models/question.model';
import { BaseQuestionComponent } from '../base/base-question/base-question.component';

@Component({
  selector: 'app-question-answer',
  templateUrl: './question-answer.component.html',
  styleUrls: ['./question-answer.component.scss']
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
        this.canSubmit = !!this.selectedAnswer && String(this.selectedAnswer).trim().length > 0;
        break;
      case 'sequence':
        this.canSubmit = this.shuffledSequenceItems.length > 0;
        break;
      case 'true_false':
        this.canSubmit = !!this.selectedAnswer;
        break;
      case 'numerical':
        this.canSubmit = !!this.selectedAnswer && String(this.selectedAnswer).trim().length > 0;
        break;
      case 'image':
      case 'audio':
      case 'video':
        this.canSubmit = !!this.selectedAnswer && String(this.selectedAnswer).trim().length > 0;
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
      case 'true_false':
      case 'numerical':
      case 'image':
      case 'audio':
      case 'video':
        return String(this.selectedAnswer || '');
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
