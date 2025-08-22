import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
    selector: 'app-true-false',
    templateUrl: './true-false.component.html',
    styleUrls: ['./true-false.component.scss'],
    standalone: false
})
export class TrueFalseComponent {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Input() showCorrectAnswer: boolean = false;
  @Output() answerSelected = new EventEmitter<string>();

  currentAnswer: string = '';

  selectAnswer(answer: string): void {
    if (!this.isDisabled) {
      this.currentAnswer = answer;
      this.answerSelected.emit(answer);
    }
  }
}
