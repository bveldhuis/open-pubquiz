import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { QuestionTimerComponent } from '../question-timer/question-timer.component';
import { Question } from '../../../../models/question.model';
import { QuestionUtils } from '../../../../utils';

@Component({
    selector: 'app-question-header',
    templateUrl: './question-header.component.html',
    styleUrls: ['./question-header.component.scss'],
    standalone: true,
    imports: [
        QuestionTimerComponent
    ]
})
export class QuestionHeaderComponent {
  @Input() question?: Question;
  @Input() showTimer = false;
  @Input() timeRemaining = 0;
  @Input() totalTime = 0;
  @Input() showProgress = true;
  
  @Output() timeUp = new EventEmitter<void>();
  @Output() timeChanged = new EventEmitter<number>();

  getQuestionTypeLabel(type: string): string {
    return QuestionUtils.getQuestionTypeLabel(type);
  }

  getProgressPercentage(): number {
    if (this.totalTime === 0) return 100;
    return (this.timeRemaining / this.totalTime) * 100;
  }
}
