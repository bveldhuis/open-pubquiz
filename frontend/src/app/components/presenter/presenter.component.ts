import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { TitleCasePipe } from '@angular/common';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import { QuestionDisplayComponent } from '../question/display/question-display/question-display.component';
import { SessionConfigComponent } from '../session-config/session-config.component';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { AnswerReviewComponent } from '../answer-review/answer-review.component';
import { QuizService } from '../../services/quiz.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { PWAService } from '../../services/pwa.service';
import { QuizSession } from '../../models/quiz-session.model';
import { SessionConfiguration } from '../../models/session-configuration.model';
import { Question } from '../../models/question.model';
import { SocketService } from '../../services/socket.service';
import { 
  fadeInUp, 
  slideInFromRight, 
  scaleIn, 
  buttonPress,
  cardHover,
  staggeredFadeIn,
  successPop,
  errorShake
} from '../../utils/animations';

import { Subscription, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Internal interfaces for component use
interface TeamInfo {
  id: string;
  name: string;
  total_points: number;
  answers_submitted: number;
  correct_answers: number;
}

interface AnswerInfo {
  id: string;
  question_id: string;
  team_id: string;
  answer_text: string;
  is_correct?: boolean;
  points_awarded: number;
  submitted_at: string;
}

@Component({
  selector: 'app-presenter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule,
    TitleCasePipe,
    LeaderboardComponent,
    QuestionDisplayComponent,
    SessionConfigComponent,
    QrCodeComponent,
    AnswerReviewComponent
  ],
  templateUrl: './presenter.component.html',
  styleUrl: './presenter.component.scss',
  animations: [
    fadeInUp,
    slideInFromRight,
    scaleIn,
    buttonPress,
    cardHover,
    staggeredFadeIn,
    successPop,
    errorShake
  ]
})
export class PresenterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private quizService = inject(QuizService);
  private quizManagementService = inject(QuizManagementService);
  private pwaService = inject(PWAService);
  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();
  
  // Form and session state
  sessionForm!: FormGroup;
  currentSession?: QuizSession & { code?: string; };
  sessionConfiguration?: SessionConfiguration;
  
  // Quiz state
  questions: Question[] = [];
  currentQuestionIndex = 0;
  currentQuestion?: Question;
  isQuestionActive = false;
  timeRemaining = 0;
  
  // Answer management
  answers: AnswerInfo[] = [];
  teams: TeamInfo[] = [];
  
  // UI state
  isLoading = false;
  currentView: 'setup' | 'session-config' | 'active' | 'review' | 'leaderboard' = 'setup';
  showQRCode = false;
  
  // Compatibility properties for existing template
  showConfigurationForm = false;
  isConnected = false;
  showReview = false;
  showLeaderboard = false;
  submissionsReceived = 0;
  currentAnswers: AnswerInfo[] = [];
  isLoadingAnswers = false;
  leaderboardTeams: TeamInfo[] = [];
  
  // Animation states
  buttonStates: Record<string, string> = {};
  cardStates: Record<string, string> = {};
  viewTransitionState = '';
  
  // Touch and accessibility
  isTouchDevice = false;
  isReducedMotion = false;
  
  private timerSubscription?: Subscription;
  private subscriptions: Subscription[] = [];

  constructor() {
    this.detectDeviceCapabilities();
    this.checkAccessibilityPreferences();
    this.initializeAnimationStates();
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupSocketListeners();
    this.setupPWANotifications();
    this.loadExistingSession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopTimer();
  }

  private detectDeviceCapabilities(): void {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (this.isTouchDevice) {
      document.body.classList.add('touch-device');
    }
  }

  private checkAccessibilityPreferences(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isReducedMotion = true;
      document.body.classList.add('reduced-motion');
    }
  }

  private initializeAnimationStates(): void {
    this.buttonStates = {
      create: 'unpressed',
      start: 'unpressed',
      next: 'unpressed',
      end: 'unpressed',
      review: 'unpressed'
    };
    this.cardStates = {
      main: 'normal',
      question: 'normal',
      teams: 'normal',
      config: 'normal'
    };
  }

  private initializeForm(): void {
    this.sessionForm = this.fb.group({
      sessionName: ['', [Validators.required, Validators.minLength(3)]],
      maxTeams: [10, [Validators.required, Validators.min(2), Validators.max(50)]],
      timePerQuestion: [30, [Validators.required, Validators.min(10), Validators.max(300)]]
    });
  }

  private setupPWANotifications(): void {
    this.pwaService.requestNotificationPermission()
      .then(granted => {
        if (granted) {
          console.log('Notifications enabled for presenter');
        }
      });
  }

  private setupSocketListeners(): void {
    // Enhanced socket listeners with animations and notifications
    this.socketService.on('team-joined')
      .pipe(takeUntil(this.destroy$))
      .subscribe((team: TeamInfo) => {
        this.handleTeamJoined(team);
      });

    this.socketService.on('answer-submitted')
      .pipe(takeUntil(this.destroy$))
      .subscribe((answer: AnswerInfo) => {
        this.handleAnswerSubmitted(answer);
      });

    this.socketService.on('session-error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((error: { message?: string }) => {
        this.handleSessionError(error);
      });
  }

  private async handleTeamJoined(team: TeamInfo): Promise<void> {
    this.teams.push(team);
    this.showSuccessFeedback(`Team "${team.name}" joined the session!`);
    
    // Haptic feedback for mobile
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }

  private async handleAnswerSubmitted(answer: AnswerInfo): Promise<void> {
    this.answers.push(answer);
    this.showInfoMessage(`Answer received from team`);
    
    // Update UI state
    this.updateTeamStats();
  }

  private handleSessionError(error: { message?: string }): void {
    this.showErrorFeedback(error.message || 'An error occurred');
  }

  private loadExistingSession(): void {
    // Check if there's an existing session
    const existingSession = localStorage.getItem('presenterSession');
    if (existingSession) {
      try {
        this.currentSession = JSON.parse(existingSession);
        this.currentView = 'active';
      } catch (error) {
        console.error('Failed to load existing session:', error);
      }
    }
  }

  // Enhanced user interactions with animations
  async createSession(): Promise<void> {
    if (!this.sessionForm.valid) {
      this.showErrorFeedback('Please fill out all required fields correctly');
      return;
    }

    this.buttonStates['create'] = 'pressed';
    this.isLoading = true;

    try {
      const formValue = this.sessionForm.value;
      
      const sessionData = {
        name: formValue.sessionName,
        maxTeams: formValue.maxTeams,
        timePerQuestion: formValue.timePerQuestion
      };

      const response = await this.quizService.createSession(sessionData).toPromise();
      
      if (response && response.session) {
        this.currentSession = { ...response.session, code: response.session.code };
        localStorage.setItem('presenterSession', JSON.stringify(response.session));
        
        this.transitionToView('session-config');
        this.showSuccessFeedback('Session created successfully!');
        
        // PWA notification
        await this.pwaService.showNotification('Session Created', {
          body: `Quiz session "${formValue.sessionName}" is ready!`
        });
      }
    } catch (error) {
      this.showErrorFeedback('Failed to create session. Please try again.');
      console.error('Session creation error:', error);
    } finally {
      this.isLoading = false;
      setTimeout(() => {
        this.buttonStates['create'] = 'unpressed';
      }, 200);
    }
  }

  async startSession(): Promise<void> {
    if (!this.currentSession || !this.sessionConfiguration) {
      this.showErrorFeedback('Session configuration is required');
      return;
    }

    this.buttonStates['start'] = 'pressed';
    this.isLoading = true;

    try {
      // Start the session
      await this.quizManagementService.startSession(this.currentSession.id).toPromise();
      
      this.transitionToView('active');
      this.showSuccessFeedback('Session started! Teams can now join.');
      
      // Initialize first question if available
      if (this.questions.length > 0) {
        this.currentQuestion = this.questions[0];
        this.currentQuestionIndex = 0;
      }
      
    } catch (error) {
      this.showErrorFeedback('Failed to start session. Please try again.');
      console.error('Session start error:', error);
    } finally {
      this.isLoading = false;
      setTimeout(() => {
        this.buttonStates['start'] = 'unpressed';
      }, 200);
    }
  }

  async startQuestion(): Promise<void> {
    if (!this.currentQuestion) return;

    this.buttonStates['next'] = 'pressed';
    
    try {
      this.isQuestionActive = true;
      this.timeRemaining = this.currentQuestion.time_limit || 30;
      this.startTimer();
      
      // Notify teams
      this.socketService.emit('question-started', {
        question: this.currentQuestion,
        timeLimit: this.timeRemaining
      });
      
      this.showSuccessFeedback('Question started!');
      
      // PWA notification for question start
      await this.pwaService.showNotification('Question Started', {
        body: `Question ${this.currentQuestionIndex + 1} is now active`
      });
      
    } finally {
      setTimeout(() => {
        this.buttonStates['next'] = 'unpressed';
      }, 200);
    }
  }

  async endQuestion(): Promise<void> {
    this.buttonStates['end'] = 'pressed';
    
    try {
      this.isQuestionActive = false;
      this.stopTimer();
      
      // Notify teams
      this.socketService.emit('question-ended', {
        questionId: this.currentQuestion?.id
      });
      
      this.transitionToView('review');
      this.showSuccessFeedback('Question ended. Review answers.');
      
    } finally {
      setTimeout(() => {
        this.buttonStates['end'] = 'unpressed';
      }, 200);
    }
  }

  async nextQuestion(): Promise<void> {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.transitionToView('active');
      this.showInfoMessage(`Question ${this.currentQuestionIndex + 1} ready`);
    } else {
      await this.endSession();
    }
  }

  async endSession(): Promise<void> {
    this.buttonStates['end'] = 'pressed';
    
    try {
      if (this.currentSession) {
        await this.quizManagementService.endSession(this.currentSession.id).toPromise();
      }
      
      // Notify teams
      this.socketService.emit('session-ended', {
        leaderboard: this.teams.sort((a, b) => b.total_points - a.total_points)
      });
      
      this.transitionToView('leaderboard');
      this.showSuccessFeedback('Session ended successfully!');
      
      // PWA notification
      await this.pwaService.showNotification('Session Complete', {
        body: 'Quiz session has ended. View final results.'
      });
      
    } catch (error) {
      this.showErrorFeedback('Failed to end session properly');
      console.error('Session end error:', error);
    } finally {
      setTimeout(() => {
        this.buttonStates['end'] = 'unpressed';
      }, 200);
    }
  }

  // Timer management
  private startTimer(): void {
    this.stopTimer();
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        
        // Notify about time running out
        if (this.timeRemaining === 10) {
          this.showWarningMessage('10 seconds remaining!');
        }
      } else {
        this.endQuestion();
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  // View transitions with animations
  private transitionToView(newView: typeof this.currentView): void {
    this.viewTransitionState = 'transitioning';
    
    setTimeout(() => {
      this.currentView = newView;
      this.viewTransitionState = '';
    }, this.isReducedMotion ? 0 : 200);
  }

  // Configuration and data management
  onSessionConfigured(config: SessionConfiguration): void {
    this.sessionConfiguration = config;
    // Note: SessionConfiguration might not have questions property directly
    // This would be populated separately through question generation
    this.showSuccessFeedback('Session configured successfully!');
  }

  onQuestionsLoaded(questions: Question[]): void {
    this.questions = questions;
    this.showSuccessFeedback(`${questions.length} questions loaded`);
  }

  private updateTeamStats(): void {
    // Update team statistics based on answers
    this.teams.forEach(team => {
      const teamAnswers = this.answers.filter(a => a.team_id === team.id);
      team.answers_submitted = teamAnswers.length;
      team.correct_answers = teamAnswers.filter(a => a.is_correct).length;
      team.total_points = teamAnswers.reduce((sum, a) => sum + a.points_awarded, 0);
    });
  }

  // UI Interactions
  toggleQRCode(): void {
    this.showQRCode = !this.showQRCode;
    this.showInfoMessage(this.showQRCode ? 'QR Code displayed' : 'QR Code hidden');
  }

  // Feedback methods with animations
  private showSuccessFeedback(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorFeedback(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  // Touch event handlers
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.isTouchDevice) {
      const target = event.target as HTMLElement;
      if (target.classList.contains('touch-friendly')) {
        target.classList.add('touch-active');
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.isTouchDevice) {
      const target = event.target as HTMLElement;
      setTimeout(() => {
        target.classList.remove('touch-active');
      }, 150);
    }
  }

  // Keyboard navigation support
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Spacebar to start/end questions
    if (event.code === 'Space' && this.currentView === 'active') {
      event.preventDefault();
      if (this.isQuestionActive) {
        this.endQuestion();
      } else {
        this.startQuestion();
      }
    }
    
    // Arrow keys for navigation
    if (event.key === 'ArrowRight' && this.currentView === 'review') {
      this.nextQuestion();
    }
    
    // Escape to end session
    if (event.key === 'Escape' && this.currentView !== 'setup') {
      if (confirm('Are you sure you want to end the session?')) {
        this.endSession();
      }
    }
  }

  // Card hover animations
  onCardHover(cardId: string, isHovered: boolean): void {
    if (!this.isReducedMotion) {
      this.cardStates[cardId] = isHovered ? 'hovered' : 'normal';
    }
  }

  // Utility getters
  get sessionCode(): string {
    return this.currentSession?.code || '';
  }

  // Template compatibility getter
  get sessionCodeForTemplate(): string {
    return this.sessionCode;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get currentQuestionNumber(): number {
    return this.currentQuestionIndex + 1;
  }

  get completedQuestions(): number {
    return this.currentQuestionIndex;
  }

  get sessionProgress(): number {
    return this.totalQuestions > 0 ? (this.completedQuestions / this.totalQuestions) * 100 : 0;
  }

  // Compatibility methods for existing template
  onConfigurationCancelled(): void {
    this.showConfigurationForm = false;
  }

  showSessionConfiguration(): void {
    this.showConfigurationForm = true;
  }

  generateQuestionsForCurrentRound(): void {
    if (!this.currentSession) return;
    this.showInfoMessage('Generating questions...');
  }

  getQuestionTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      multiple_choice: 'Multiple Choice',
      open_text: 'Open Text',
      sequence: 'Sequence',
      true_false: 'True/False',
      numerical: 'Numerical',
      image: 'Image',
      audio: 'Audio',
      video: 'Video'
    };
    return displayNames[type] || type;
  }

  getQuizStatusClass(): string {
    if (this.isQuestionActive) return 'active';
    if (this.showReview) return 'review';
    if (this.showLeaderboard) return 'leaderboard';
    return 'waiting';
  }

  getQuizStatusText(): string {
    if (this.isQuestionActive) return 'Question Active';
    if (this.showReview) return 'Reviewing Answers';
    if (this.showLeaderboard) return 'Showing Leaderboard';
    return 'Waiting';
  }

  showQuestionReview(): void {
    this.showReview = true;
    this.showLeaderboard = false;
    this.isQuestionActive = false;
  }

  endRound(): void {
    this.showReview = true;
    this.isQuestionActive = false;
    this.showSuccessFeedback('Round ended. Review answers.');
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
    }
  }

  scoreAnswer(): void {
    this.showSuccessFeedback('Answer scored!');
  }

  nextReviewQuestion(): void {
    this.nextQuestion();
  }

  showLeaderboardView(): void {
    this.showLeaderboard = true;
    this.showReview = false;
  }

  isLastRound(): boolean {
    return true; // Simplified for compatibility
  }

  startNextRound(): void {
    this.showSuccessFeedback('Starting next round...');
  }

  createNewSession(): void {
    this.currentSession = undefined;
    this.currentView = 'setup';
  }

  onTimeUp(): void {
    this.endQuestion();
  }

  onTimeChanged(timeRemaining: number): void {
    this.timeRemaining = timeRemaining;
  }

  onQrGenerated(): void {
    this.showSuccessFeedback('QR code generated successfully!');
  }

  onQrError(error: string | ErrorEvent): void {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    this.showErrorFeedback(`QR code error: ${errorMessage}`);
  }
}
