import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
  selector: 'app-multiple-choice',
  templateUrl: './multiple-choice.component.html',
  styleUrls: ['./multiple-choice.component.scss']
})
export class MultipleChoiceComponent {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() selectedAnswer?: string;
  @Input() showCorrectAnswer = false;
  @Input() isAnswerSubmitted = false;
  
  @Output() answerSelected = new EventEmitter<string>();

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A = 65 in ASCII
  }

  onOptionClick(option: string) {
    if (this.isInteractive && !this.isAnswerSubmitted) {
      this.answerSelected.emit(option);
    }
  }
}
