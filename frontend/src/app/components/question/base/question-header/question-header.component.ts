import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../../models/question.model';
import { QuestionUtils } from '../../../../utils';

@Component({
    selector: 'app-question-header',
    templateUrl: './question-header.component.html',
    styleUrls: ['./question-header.component.scss'],
    standalone: false
})
export class QuestionHeaderComponent {
  @Input() question?: Question;
  @Input() showTimer = false;
  @Input() timeRemaining = 0;
  @Input() totalTime = 0;
  @Input() showProgress = true;
  
  @Output() onTimeUp = new EventEmitter<void>();
  @Output() onTimeChanged = new EventEmitter<number>();

  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getProgressPercentage(): number {
    if (this.totalTime === 0) return 100;
    return (this.timeRemaining / this.totalTime) * 100;
  }
}
