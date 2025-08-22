import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-answer-controls',
    templateUrl: './answer-controls.component.html',
    styleUrls: ['./answer-controls.component.scss'],
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule
    ]
})
export class AnswerControlsComponent {
  @Input() isActive = false;
  @Input() canSubmit = false;
  @Input() isAnswerSubmitted = false;
  @Input() timeRemaining = 0;
  @Input() questionType = '';
  
  @Output() submitAnswer = new EventEmitter<void>();

  getSubmitHint(): string {
    switch (this.questionType) {
      case 'multiple_choice':
        return 'Please select an answer before submitting.';
      case 'open_text':
        return 'Please enter your answer before submitting.';
      case 'sequence':
        return 'Please arrange the items in order before submitting.';
      default:
        return 'Please provide an answer before submitting.';
    }
  }
}
