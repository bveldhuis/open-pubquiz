import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { MultipleChoiceComponent } from '../../types/multiple-choice/multiple-choice.component';
import { OpenTextComponent } from '../../types/open-text/open-text.component';
import { SequenceComponent } from '../../types/sequence/sequence.component';
import { TrueFalseComponent } from '../../types/true-false/true-false.component';
import { NumericalComponent } from '../../types/numerical/numerical.component';
import { ImageComponent } from '../../types/image/image.component';
import { AudioComponent } from '../../types/audio/audio.component';
import { VideoComponent } from '../../types/video/video.component';
import { Question } from '../../../../models/question.model';


@Component({
    selector: 'app-question-content',
    templateUrl: './question-content.component.html',
    styleUrls: ['./question-content.component.scss'],
    standalone: true,
    imports: [
        MultipleChoiceComponent,
        OpenTextComponent,
        SequenceComponent,
        TrueFalseComponent,
        NumericalComponent,
        ImageComponent,
        AudioComponent,
        VideoComponent
    ]
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
