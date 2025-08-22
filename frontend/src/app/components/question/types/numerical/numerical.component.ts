import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
    selector: 'app-numerical',
    templateUrl: './numerical.component.html',
    styleUrls: ['./numerical.component.scss'],
    standalone: false
})
export class NumericalComponent {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Output() answerChange = new EventEmitter<string>();

  currentAnswer: string = '';

  onAnswerChange(): void {
    this.answerChange.emit(this.currentAnswer);
  }

  onInputChange(): void {
    this.onAnswerChange();
  }
}
