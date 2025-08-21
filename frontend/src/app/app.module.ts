import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

// Components
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { PresenterComponent } from './components/presenter/presenter.component';
import { ParticipantComponent } from './components/participant/participant.component';
import { JoinComponent } from './components/join/join.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { AnswerReviewComponent } from './components/answer-review/answer-review.component';

// New Optimized Question Components
import { BaseQuestionComponent } from './components/question/base/base-question.component';
import { QuestionTimerComponent } from './components/question/base/question-timer.component';
import { QuestionHeaderComponent } from './components/question/base/question-header.component';
import { QuestionContentComponent } from './components/question/display/question-content.component';
import { QuestionDisplayComponent } from './components/question/display/question-display.component';
import { QuestionAnswerComponent } from './components/question/answer/question-answer.component';
import { PresenterControlsComponent } from './components/question/controls/presenter-controls.component';
import { AnswerControlsComponent } from './components/question/controls/answer-controls.component';
import { MultipleChoiceComponent } from './components/question/types/multiple-choice.component';
import { OpenTextComponent } from './components/question/types/open-text.component';
import { SequenceComponent } from './components/question/types/sequence.component';
import { TrueFalseComponent } from './components/question/types/true-false.component';
import { NumericalComponent } from './components/question/types/numerical.component';
import { ImageComponent } from './components/question/types/image.component';
import { AudioComponent } from './components/question/types/audio.component';
import { VideoComponent } from './components/question/types/video.component';

// Legacy Components (to be implemented/updated)
import { ReviewComponent } from './components/review/review.component';
import { QrCodeComponent } from './components/qr-code/qr-code.component';

// Services
import { QuizService } from './services/quiz.service';
import { QuizManagementService } from './services/quiz-management.service';
import { SocketService } from './services/socket.service';
import { AuthService } from './services/auth.service';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'presenter', component: PresenterComponent },
  { path: 'join', component: JoinComponent },
  { path: 'participant', component: ParticipantComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PresenterComponent,
    ParticipantComponent,
    JoinComponent,
    LeaderboardComponent,
    AnswerReviewComponent,

    // New Optimized Question Components
    QuestionTimerComponent,
    QuestionHeaderComponent,
    QuestionContentComponent,
    QuestionDisplayComponent,
    QuestionAnswerComponent,
    PresenterControlsComponent,
    AnswerControlsComponent,
    MultipleChoiceComponent,
    OpenTextComponent,
    SequenceComponent,
    TrueFalseComponent,
    NumericalComponent,
    ImageComponent,
    AudioComponent,
    VideoComponent,

    // Legacy Components (to be implemented/updated)
    ReviewComponent,
    QrCodeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    
    // Angular Material modules
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatChipsModule,
    MatDialogModule,
    MatTabsModule,
    MatExpansionModule,
    MatBadgeModule,
    MatDividerModule,
    MatStepperModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatSidenavModule,
    MatGridListModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule
  ],
  providers: [
    QuizService,
    QuizManagementService,
    SocketService,
    AuthService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
