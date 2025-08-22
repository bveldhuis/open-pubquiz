import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Question } from '../../../../models/question.model';


@Component({
    selector: 'app-numerical',
    templateUrl: './numerical.component.html',
    styleUrls: ['./numerical.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule
    ]
})
export class NumericalComponent {
  @Input() question?: Question;
  @Input() isDisabled= false;
  @Output() answerChange = new EventEmitter<string>();

  currentAnswer = '';

  onAnswerChange(): void {
    this.answerChange.emit(this.currentAnswer);
  }

  onInputChange(): void {
    this.onAnswerChange();
  }
}
