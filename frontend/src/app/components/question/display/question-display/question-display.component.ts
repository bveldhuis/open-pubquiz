import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { QuestionHeaderComponent } from '../../base/question-header/question-header.component';
import { QuestionContentComponent } from '../question-content/question-content.component';
import { PresenterControlsComponent } from '../../controls/presenter-controls/presenter-controls.component';

import { BaseQuestionComponent } from '../../base/base-question/base-question.component';

@Component({
    selector: 'app-question-display',
    templateUrl: './question-display.component.html',
    styleUrls: ['./question-display.component.scss'],
    animations: [
        trigger('questionAnimation', [
            state('hide', style({
                opacity: 0,
                transform: 'translateY(-20px)'
            })),
            state('show', style({
                opacity: 1,
                transform: 'translateY(0)'
            })),
            transition('hide => show', [
                animate('0.5s ease-out')
            ]),
            transition('show => hide', [
                animate('0.3s ease-in')
            ])
        ])
    ],
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        QuestionHeaderComponent,
        QuestionContentComponent,
        PresenterControlsComponent
    ]
})
export class QuestionDisplayComponent extends BaseQuestionComponent {
  @Input() isActive = false;
  @Input() showCorrectAnswer = false;
  @Input() canStart = true;
  @Input() hasAnswers = false;
  @Input() submissionsReceived = 0;
  @Input() totalTeams = 0;
  @Input() totalTime = 0;
  @Input() showControls = true;
  @Input() isLastQuestion = false;
  
  @Output() startQuestion = new EventEmitter<void>();
  @Output() endQuestion = new EventEmitter<void>();
  @Output() showReview = new EventEmitter<void>();
  @Output() nextQuestion = new EventEmitter<void>();
  @Output() endRound = new EventEmitter<void>();
  @Output() timeUp = new EventEmitter<void>();
  @Output() timeChanged = new EventEmitter<number>();
}
