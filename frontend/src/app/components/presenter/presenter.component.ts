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
  totalQuestionsInSession = 0;
  
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
  currentQuestionHasAnswers = false;
  
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
    // Connect to socket server first
    this.socketService.connect();
    
    // Listen to socket connection status
    this.socketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected: boolean) => {
        this.isConnected = connected;
        if (connected) {
          this.showSuccessFeedback('Connected to quiz server');
        } else {
          this.showErrorFeedback('Disconnected from quiz server');
        }
      });
    
    // Enhanced socket listeners with animations and notifications
    this.socketService.on('team_joined_session')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Presenter received team_joined_session event:', data);
        this.handleTeamJoined(data as { teamId: string; teamName: string });
      });

    this.socketService.on('existing_teams')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Presenter received existing_teams event:', data);
        const teamsData = data as { teams: TeamInfo[] };
        this.teams = teamsData.teams;
        console.log('Set teams to:', this.teams);
        if (teamsData.teams.length > 0) {
          this.showInfoMessage(`${teamsData.teams.length} team(s) already in session`);
        }
      });

    this.socketService.on('answer_received')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Presenter received answer_received event:', data);
        this.handleAnswerSubmitted(data as { teamId: string; teamName: string; questionId: string });
      });

    this.socketService.on('session-error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        this.handleSessionError(data as { message?: string });
      });
  }

  private async handleTeamJoined(data: { teamId: string; teamName: string }): Promise<void> {
    console.log('Presenter handling team joined with data:', data);
    
    // Check if team already exists
    const existingTeam = this.teams.find(team => team.id === data.teamId);
    if (existingTeam) {
      console.log('Team already exists, not adding duplicate:', existingTeam);
      return;
    }
    
    // Create a TeamInfo object from the received data
    const team: TeamInfo = {
      id: data.teamId,
      name: data.teamName,
      total_points: 0,
      answers_submitted: 0,
      correct_answers: 0
    };
    
    console.log('Created team object:', team);
    console.log('Current teams before push:', this.teams);
    
    this.teams.push(team);
    
    console.log('Current teams after push:', this.teams);
    this.showSuccessFeedback(`Team "${team.name}" joined the session!`);
    
    // Haptic feedback for mobile
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }

  private async handleAnswerSubmitted(answerData: { teamId: string; teamName: string; questionId: string }): Promise<void> {
    console.log('Presenter received answer:', answerData);
    
    // Create a simple answer info object for tracking
    const answer: AnswerInfo = {
      id: `temp-${Date.now()}`,
      question_id: answerData.questionId,
      team_id: answerData.teamId,
      answer_text: 'Submitted',
      is_correct: false,
      points_awarded: 0,
      submitted_at: new Date().toISOString()
    };
    
    this.answers.push(answer);
    this.submissionsReceived++;
    
    // Update current answers for the current question
    if (this.currentQuestion && answerData.questionId === this.currentQuestion.id) {
      this.currentAnswers.push(answer);
      // Mark that this question now has answers
      this.currentQuestionHasAnswers = true;
    }
    
    this.showInfoMessage(`Answer received from team ${answerData.teamName}`);
    
    // Update UI state
    this.updateTeamStats();
    
    // Haptic feedback for mobile
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  // Method to check if a question has answers in the database
  private async checkQuestionHasAnswers(questionId: string): Promise<boolean> {
    try {
      const response = await this.quizManagementService.getAnswersForQuestion(questionId).toPromise();
      return (response?.answers && response.answers.length > 0) || false;
    } catch (error) {
      console.error('Failed to check if question has answers:', error);
      return false;
    }
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
        
        // Join the presenter room for existing session
        if (this.currentSession?.code) {
          this.socketService.joinRoom(this.currentSession.code);
          console.log('Presenter joined room for existing session:', this.currentSession.code);
        }
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
        
        // Join the presenter room for this session
        this.socketService.joinRoom(this.currentSession.code);
        console.log('Presenter joined room for session:', this.currentSession.code);
        
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
      // Start the session by updating its status to ACTIVE
      await this.quizManagementService.updateSessionStatus(this.currentSession.code, 'active').toPromise();
      
      this.transitionToView('active');
      this.showSuccessFeedback('Session started! Teams can now join.');
      
      // Initialize first question if available
      if (this.questions.length > 0) {
        this.currentQuestion = this.questions[0];
        this.currentQuestionIndex = 0;
        
        // Check if the first question has answers in the database
        this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
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
      
      // Reset submission counters for new question
      this.submissionsReceived = 0;
      this.currentAnswers = [];
      this.currentQuestionHasAnswers = false;
      
      // Send initial timer value immediately
      if (this.currentSession?.code) {
        this.socketService.emit('timer_update', {
          sessionCode: this.currentSession.code,
          timeRemaining: this.timeRemaining
        });
      }
      
      // Notify teams using presenter action
      console.log('Presenter starting question:', this.currentQuestion?.id);
      this.socketService.presenterAction({
        sessionCode: this.currentSession!.code!,
        action: 'start_question',
        questionId: this.currentQuestion?.id
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
      
      // Send final timer update (0) to stop participant timers
      if (this.currentSession?.code) {
        this.socketService.emit('timer_update', {
          sessionCode: this.currentSession.code,
          timeRemaining: 0
        });
      }
      
      // Notify teams using presenter action
      this.socketService.presenterAction({
        sessionCode: this.currentSession!.code!,
        action: 'end_question'
      });
      
      // Check if this was the last question in the round
      if (this.currentQuestionIndex === this.questions.length - 1) {
        // This was the last question, start review
        this.startReview();
      } else {
        // Move to next question
        this.currentQuestionIndex++;
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        
        // Check if this question has answers in the database
        if (this.currentQuestion) {
          this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
        }
        
        this.showSuccessFeedback('Question ended. Next question ready.');
      }
      
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
      
      // Check if this question has answers in the database
      if (this.currentQuestion) {
        this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
      }
      
      this.transitionToView('active');
      this.showInfoMessage(`Question ${this.currentQuestionIndex + 1} ready`);
    } else {
      // This is the last question, start review instead of ending session
      await this.startReview();
    }
  }

  async endSession(): Promise<void> {
    this.buttonStates['end'] = 'pressed';
    
    try {
      if (this.currentSession) {
        await this.quizManagementService.endSession(this.currentSession.code).toPromise();
      }
      
      // Sort teams by total points for final leaderboard
      const finalLeaderboard = this.teams.sort((a, b) => b.total_points - a.total_points);
      
      // Set the final leaderboard data
      this.leaderboardTeams = finalLeaderboard;
      
      // Notify teams using presenter action
      this.socketService.presenterAction({
        sessionCode: this.currentSession!.code!,
        action: 'end_session',
        leaderboard: finalLeaderboard
      });
      
      // Clear the current session from localStorage and component state FIRST
      localStorage.removeItem('presenterSession');
      this.currentSession = undefined;
      
      // Show the final leaderboard AFTER clearing the session
      this.showLeaderboard = true;
      
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
        
        // Send timer update to all participants via socket
        if (this.currentSession?.code) {
          this.socketService.emit('timer_update', {
            sessionCode: this.currentSession.code,
            timeRemaining: this.timeRemaining
          });
        }
        
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
    this.showConfigurationForm = false; // Hide the configuration form
    // Note: SessionConfiguration might not have questions property directly
    // This would be populated separately through question generation
    this.showSuccessFeedback('Session configured successfully!');
  }

  onQuestionsLoaded(questions: Question[]): void {
    this.questions = questions;
    this.totalQuestionsInSession = questions.length;
    this.showSuccessFeedback(`${questions.length} questions loaded`);
  }

  private updateTeamStats(): void {
    // Update team statistics based on all answers (both current and historical)
    this.teams.forEach(team => {
      // Get all answers for this team from both arrays
      const allTeamAnswers = [
        ...this.answers.filter(a => a.team_id === team.id),
        ...this.currentAnswers.filter(a => a.team_id === team.id)
      ];
      
      // Remove duplicates based on answer ID
      const uniqueAnswers = allTeamAnswers.filter((answer, index, self) => 
        index === self.findIndex(a => a.id === answer.id)
      );
      
      team.answers_submitted = uniqueAnswers.length;
      team.correct_answers = uniqueAnswers.filter(a => a.is_correct === true).length;
      team.total_points = uniqueAnswers.reduce((sum, a) => sum + (a.points_awarded || 0), 0);
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
    
    this.isLoading = true;
    this.showInfoMessage('Generating questions...');
    
    // Clear any existing answers when generating new questions
    this.currentAnswers = [];
    this.submissionsReceived = 0;
    this.currentQuestionHasAnswers = false;
    
    // Generate questions for the current round
    const currentRound = this.currentSession.current_round || 1;
    this.quizManagementService.generateQuestionsForRound(this.currentSession.code, currentRound)
      .subscribe({
                 next: async (response) => {
           this.questions = response.questions;
           this.totalQuestionsInSession = response.questions.length;
           this.isLoading = false;
           this.showSuccessFeedback(`Generated ${response.questions.length} questions for round ${currentRound}`);
          
          // Set the first question as current if available
          if (this.questions.length > 0) {
            this.currentQuestion = this.questions[0];
            this.currentQuestionIndex = 0;
            
            // Check if the first question has answers in the database
            this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error generating questions:', error);
          this.showErrorFeedback('Failed to generate questions. Please try again.');
        }
      });
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

  async startReview(): Promise<void> {
    // Start review from the first question
    this.currentQuestionIndex = 0;
    this.currentQuestion = this.questions[0];
    
    // Load answers for the first question
    if (this.currentQuestion) {
      // Check if this question has answers in the database
      this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
      
      this.isLoadingAnswers = true;
      this.quizManagementService.getAnswersForQuestion(this.currentQuestion.id)
        .subscribe({
          next: (response) => {
            this.currentAnswers = (response?.answers || []) as AnswerInfo[];
            this.submissionsReceived = this.currentAnswers.length;
            console.log('Loaded answers for first review question:', this.currentAnswers);
            this.isLoadingAnswers = false;
            
            // Update team stats after loading answers
            this.updateTeamStats();
          },
          error: (error) => {
            console.error('Failed to load answers for review:', error);
            this.showErrorFeedback('Failed to load answers for review');
            this.isLoadingAnswers = false;
          }
        });
    }
    
    this.showReview = true;
    this.showLeaderboard = false;
    this.isQuestionActive = false;
    this.showSuccessFeedback('Round ended. Review answers.');
  }

  async showQuestionReview(): Promise<void> {
    // Start review from the first question
    this.currentQuestionIndex = 0;
    this.currentQuestion = this.questions[0];
    
    // Load answers for the first question
    if (this.currentQuestion) {
      // Check if this question has answers in the database
      this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
      
      this.isLoadingAnswers = true;
      this.quizManagementService.getAnswersForQuestion(this.currentQuestion.id)
        .subscribe({
          next: (response) => {
            this.currentAnswers = (response?.answers || []) as AnswerInfo[];
            this.submissionsReceived = this.currentAnswers.length;
            console.log('Loaded answers for first review question:', this.currentAnswers);
            this.isLoadingAnswers = false;
            
            // Update team stats after loading answers
            this.updateTeamStats();
          },
          error: (error) => {
            console.error('Failed to load answers for review:', error);
            this.showErrorFeedback('Failed to load answers for review');
            this.isLoadingAnswers = false;
          }
        });
    }
    
    this.showReview = true;
    this.showLeaderboard = false;
    this.isQuestionActive = false;
  }

  async endRound(): Promise<void> {
    await this.startReview();
  }

  async previousQuestion(): Promise<void> {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      
      // Clear current answers and load answers for the specific question
      this.currentAnswers = [];
      this.submissionsReceived = 0;
      
      if (this.currentQuestion) {
        // Check if this question has answers in the database
        this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
        
        if (this.showReview) {
          // In review mode, load the actual answers
          this.isLoadingAnswers = true;
          this.quizManagementService.getAnswersForQuestion(this.currentQuestion.id)
            .subscribe({
              next: (response) => {
                this.currentAnswers = (response?.answers || []) as AnswerInfo[];
                // For review, show the actual number of answers submitted
                this.submissionsReceived = this.currentAnswers.length;
                console.log('Loaded answers for review question:', this.currentQuestionIndex + 1, this.currentAnswers);
                this.isLoadingAnswers = false;
                
                // Update team stats after loading answers
                this.updateTeamStats();
              },
              error: (error) => {
                console.error('Failed to load answers for review:', error);
                this.showErrorFeedback('Failed to load answers for review');
                this.isLoadingAnswers = false;
              }
            });
        }
      }
    }
  }

  scoreAnswer(answerId: string, points: number, isCorrect: boolean): void {
    this.isLoading = true;
    
    this.quizManagementService.scoreAnswer(answerId, points, isCorrect)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update the local answer data
            const answerIndex = this.currentAnswers.findIndex(a => a.id === answerId);
            if (answerIndex !== -1) {
              this.currentAnswers[answerIndex].points_awarded = points;
              this.currentAnswers[answerIndex].is_correct = isCorrect;
            }
            
            // Update team stats
            this.updateTeamStats();
            
            this.showSuccessFeedback('Answer scored successfully!');
          } else {
            this.showErrorFeedback('Failed to score answer');
          }
        },
        error: (error) => {
          console.error('Error scoring answer:', error);
          this.showErrorFeedback('Failed to score answer. Please try again.');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  async nextReviewQuestion(): Promise<void> {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      
      // Clear current answers and load answers for the specific question
      this.currentAnswers = [];
      this.submissionsReceived = 0;
      
      if (this.currentQuestion) {
        // Check if this question has answers in the database
        this.currentQuestionHasAnswers = await this.checkQuestionHasAnswers(this.currentQuestion.id);
        
        this.isLoadingAnswers = true;
        this.quizManagementService.getAnswersForQuestion(this.currentQuestion.id)
          .subscribe({
            next: (response) => {
              this.currentAnswers = (response?.answers || []) as AnswerInfo[];
              // For review, show the actual number of answers submitted
              this.submissionsReceived = this.currentAnswers.length;
              console.log('Loaded answers for review question:', this.currentQuestionIndex + 1, this.currentAnswers);
              this.isLoadingAnswers = false;
              
              // Update team stats after loading answers
              this.updateTeamStats();
            },
            error: (error) => {
              console.error('Failed to load answers for review:', error);
              this.showErrorFeedback('Failed to load answers for review');
              this.isLoadingAnswers = false;
            }
          });
      }
    } else {
      // All questions reviewed, show leaderboard
      this.showLeaderboardView();
    }
  }

  showLeaderboardView(): void {
    this.showLeaderboard = true;
    this.showReview = false;
  }

  isLastRound(): boolean {
    // Check if this is the last round based on session configuration
    if (this.sessionConfiguration && this.currentSession) {
      return this.currentSession.current_round >= this.sessionConfiguration.total_rounds;
    }
    // If no configuration, assume single round
    return true;
  }

  startNextRound(): void {
    if (!this.currentSession) {
      this.showErrorFeedback('No active session');
      return;
    }

    this.isLoading = true;
    this.showInfoMessage('Starting next round...');

    // Call the backend to start the next round
    this.quizManagementService.nextRound(this.currentSession.code)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Update the current round
          if (this.currentSession && response.currentRound) {
            this.currentSession.current_round = response.currentRound;
          }
          
                     // Clear answers from previous round
           this.currentAnswers = [];
           this.submissionsReceived = 0;
           this.answers = [];
           this.currentQuestionHasAnswers = false;
          
          // Generate questions for the new round
          this.generateQuestionsForCurrentRound();
          
          // Hide leaderboard and show active view
          this.showLeaderboard = false;
          this.currentView = 'active';
          
          this.showSuccessFeedback(`Round ${this.currentSession?.current_round} started!`);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error starting next round:', error);
          this.showErrorFeedback('Failed to start next round. Please try again.');
        }
      });
  }

  createNewSession(): void {
    // Clear all session data
    this.currentSession = undefined;
    this.sessionConfiguration = undefined;
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.currentQuestion = undefined;
    this.isQuestionActive = false;
    this.timeRemaining = 0;
    this.totalQuestionsInSession = 0;
    this.answers = [];
    this.teams = [];
    this.showQRCode = false;
    this.showReview = false;
    this.showLeaderboard = false;
    this.currentQuestionHasAnswers = false;
    
    // Reset loading states
    this.isLoading = false;
    
    // Reset button states
    Object.keys(this.buttonStates).forEach(key => {
      this.buttonStates[key] = 'unpressed';
    });
    
    // Reset form
    this.sessionForm.reset({
      sessionName: '',
      maxTeams: 10,
      timePerQuestion: 30
    });
    
    // Navigate to setup view
    this.currentView = 'setup';
    
    this.showInfoMessage('Ready to create a new session');
  }

  onTimeUp(): void {
    this.endQuestion();
  }

  onTimeChanged(timeRemaining: number): void {
    this.timeRemaining = timeRemaining;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onQrGenerated(_joinUrl: string): void {
    this.showSuccessFeedback('QR code generated successfully!');
  }

  onQrError(error: string | ErrorEvent): void {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    this.showErrorFeedback(`QR code error: ${errorMessage}`);
  }
}
