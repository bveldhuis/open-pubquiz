import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
  selector: 'app-question-content',
  templateUrl: './question-content.component.html',
  styleUrls: ['./question-content.component.scss']
})
export class QuestionContentComponent {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() selectedAnswer?: string;
  @Input() shuffledSequenceItems?: string[];
  @Input() showCorrectAnswer = false;
  @Input() isAnswerSubmitted = false;
  @Input() showPreview = false;
  @Input() isPresenter = false;
  @Input() isActive = false;
  
  @Output() answerSelected = new EventEmitter<string>();
  @Output() answerChanged = new EventEmitter<string>();
  @Output() answerValid = new EventEmitter<boolean>();
  @Output() sequenceReordered = new EventEmitter<string[]>();
}
