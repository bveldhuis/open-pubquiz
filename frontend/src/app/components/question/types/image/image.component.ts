import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
    selector: 'app-image',
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.scss'],
    standalone: false
})
export class ImageComponent {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Output() answerChange = new EventEmitter<string>();

  currentAnswer: string = '';

  onImageError(event: any): void {
    console.error('Image failed to load:', event);
  }

  onAnswerChange(): void {
    this.answerChange.emit(this.currentAnswer);
  }

  onInputChange(): void {
    this.onAnswerChange();
  }
}
