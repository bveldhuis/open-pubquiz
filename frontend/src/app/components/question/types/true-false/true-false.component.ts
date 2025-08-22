import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Question } from '../../../../models/question.model';


@Component({
    selector: 'app-true-false',
    templateUrl: './true-false.component.html',
    styleUrls: ['./true-false.component.scss'],
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule
    ]
})
export class TrueFalseComponent {
  @Input() question?: Question;
  @Input() isDisabled= false;
  @Input() showCorrectAnswer= false;
  @Output() answerSelected = new EventEmitter<string>();

  currentAnswer = '';

  selectAnswer(answer: string): void {
    if (!this.isDisabled) {
      this.currentAnswer = answer;
      this.answerSelected.emit(answer);
    }
  }
}
