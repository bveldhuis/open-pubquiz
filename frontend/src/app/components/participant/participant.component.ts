import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
// MatSnackBar import removed - no notifications needed
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuestionAnswerComponent } from '../question/answer/question-answer.component';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { PWAService } from '../../services/pwa.service';
import { Question } from '../../models/question.model';
import { LeaderboardTeam } from '../../models/leaderboard-team.model';
import { 
  fadeInUp, 
  slideInFromRight, 
  scaleIn, 
  buttonPress,
  cardHover,
  timerPulse
} from '../../utils/animations';

import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-participant',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    QuestionAnswerComponent
  ],
  templateUrl: './participant.component.html',
  styleUrl: './participant.component.scss',
  animations: [
    fadeInUp,
    slideInFromRight,
    scaleIn,
    buttonPress,
    cardHover,
    timerPulse
  ]
})
export class ParticipantComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private quizManagementService = inject(QuizManagementService);
  private pwaService = inject(PWAService);
  private router = inject(Router);
  // snackBar injection removed - no notifications needed

  private destroy$ = new Subject<void>();
  
  // Team info
  teamName = '';
  sessionCode = '';
  isConnected = false;
  
  // Quiz state
  currentQuestion?: Question;
  isQuestionActive = false;
  timeRemaining = 0;
  answerSubmitted = false;
  
  // Session ended state
  sessionEnded = false;
  finalLeaderboard: LeaderboardTeam[] = [];
  
  // Animation states
  buttonStates: Record<string, string> = {};
  cardStates: Record<string, string> = {};
  timerState = 'normal';
  // feedbackState removed - no notifications needed
  
  // Touch and accessibility
  isTouchDevice = false;
  isReducedMotion = false;
  
  private subscriptions: Subscription[] = [];

  constructor() {
    this.detectDeviceCapabilities();
    this.checkAccessibilityPreferences();
    this.initializeAnimationStates();
  }

  ngOnInit(): void {
    this.setupSocketListeners();
    this.loadUserSession();
    this.setupPWANotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
      reconnect: 'unpressed',
      leave: 'unpressed'
    };
    this.cardStates = {
      main: 'normal',
      question: 'normal',
      leaderboard: 'normal'
    };
  }

  private setupPWANotifications(): void {
    // Request notification permission when component loads
    this.pwaService.requestNotificationPermission()
      .then(granted => {
        if (granted) {
          console.log('Notifications enabled for participant');
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
        // Connection status handled silently - no notifications needed
      });

    this.socketService.on('question_started')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Participant received question_started event:', data);
        const eventData = data as { question: Question; timeLimit: number };
        this.handleNewQuestion(eventData.question);
      });

    this.socketService.on('question_ended')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleQuestionEnded();
      });

    this.socketService.on('session-ended')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Session ended event received:', data);
        const sessionData = data as { leaderboard: LeaderboardTeam[] };
        console.log('Processing session ended with leaderboard:', sessionData.leaderboard);
        this.handleSessionEnded(sessionData.leaderboard);
      });

    this.socketService.on('session_ended_error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Session ended error received:', data);
        const errorData = data as { message: string };
        this.handleSessionEndedError(errorData.message);
      });

    this.socketService.on('timer-update')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        const timerData = data as { timeRemaining: number };
        this.updateTimer(timerData.timeRemaining);
      });

    // Listen for team joined confirmation (sent to the participant)
    this.socketService.teamJoined$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: unknown) => {
        console.log('Team joined confirmation received:', data);
        // Success feedback removed - view shows connection status
      });
  }

  private async handleNewQuestion(question: Question): Promise<void> {
    console.log('Participant handling new question:', question);
    this.currentQuestion = question;
    this.isQuestionActive = true;
    this.answerSubmitted = false;
    
    // Handle questions without time limit
    if (question.time_limit === null || question.time_limit === undefined) {
      this.timeRemaining = 0; // No timer
      this.timerState = 'unlimited';
      console.log('Question has no time limit');
    } else {
      // Don't set timeRemaining here - it will come from the presenter's timer via socket
      this.timerState = 'normal';
    }

    // PWA notification for new question
    if (!document.hasFocus()) {
      await this.pwaService.notifyNewQuestion(question.question_text);
    }

    // Haptic feedback for mobile
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Info message removed - question is visible in the view
  }

  private handleQuestionEnded(): void {
    this.isQuestionActive = false;
    this.timeRemaining = 0; // Ensure timer shows 0 when question ends
    this.timerState = 'normal';
    // Warning message removed - question end is visible in the view
  }

  private async handleSessionEnded(leaderboard: LeaderboardTeam[]): Promise<void> {
    console.log('Handling session ended with leaderboard:', leaderboard);
    console.log('Current team name:', this.teamName);
    
    this.sessionEnded = true;
    this.finalLeaderboard = leaderboard;
    
    console.log('Session ended set to:', this.sessionEnded);
    console.log('Final leaderboard set to:', this.finalLeaderboard);
    
    // Find user's position
    const userPosition = leaderboard.findIndex(team => team.name === this.teamName) + 1;
    console.log('User position:', userPosition);
    
    // PWA notification for quiz end
    await this.pwaService.notifyQuizEnded(userPosition || undefined);
    
    // Success feedback removed - final position is visible in the view
  }

  private handleSessionEndedError(message: string): void {
    console.log('Handling session ended error:', message);
    
    // Clear the current session from localStorage
    this.authService.clearSession();
    
    // Error feedback removed - error is visible in the view
    
    // Navigate back to join screen after a short delay
    setTimeout(() => {
      this.router.navigate(['/join']);
    }, 2000);
  }

  private updateTimer(timeRemaining: number): void {
    this.timeRemaining = timeRemaining;
    
    // Don't update timer state or deactivate question if it has unlimited time
    if (this.timerState === 'unlimited') {
      return;
    }
    
    // Update timer state for animations
    if (timeRemaining <= 10 && timeRemaining > 0) {
      this.timerState = 'danger';
      // Notify about time running out
      if (timeRemaining === 10) {
        this.pwaService.notifyTimeRunningOut(timeRemaining);
      }
    } else if (timeRemaining <= 30 && timeRemaining > 0) {
      this.timerState = 'warning';
    } else {
      this.timerState = 'normal';
    }
    
    // If timer reaches 0, ensure question is marked as inactive
    if (timeRemaining === 0 && this.isQuestionActive) {
      this.isQuestionActive = false;
    }
  }

  private loadUserSession(): void {
    const session = this.authService.getCurrentSession();
    if (session) {
      this.teamName = session.teamName;
      this.sessionCode = session.sessionCode;
      
      if (session.sessionCode) {
        this.connectToSession();
      }
    } else {
      this.router.navigate(['/join']);
    }
  }

  private connectToSession(): void {
    console.log('Participant connecting to session:', this.sessionCode, this.teamName);
    this.socketService.joinSession({
      sessionCode: this.sessionCode,
      teamName: this.teamName
    });
    // Removed "Connecting to quiz session..." alert - connection happens silently
  }

  // Enhanced user interactions with animations
  async onAnswerSubmitted(answerData: unknown): Promise<void> {
    console.log('Participant submitting answer:', answerData);
    
    this.answerSubmitted = true;
    
    // Send answer to server
    this.socketService.emit('submit_answer', {
      sessionCode: this.sessionCode,
      teamId: this.authService.getCurrentSession()?.teamId,
      questionId: this.currentQuestion?.id,
      answer: answerData
    });
    
    // Success feedback removed - answer submission is visible in the view
    
    // Haptic feedback
    if (this.isTouchDevice && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }

  onTimeUp(): void {
    // Warning message removed - time up is visible in the view
  }

  onTimeChanged(timeRemaining: number): void {
    this.updateTimer(timeRemaining);
  }

  async reconnect(): Promise<void> {
    this.buttonStates['reconnect'] = 'pressed';
    
    try {
      this.connectToSession();
      
      setTimeout(() => {
        this.buttonStates['reconnect'] = 'unpressed';
      }, 200);
    } catch {
      // Error feedback removed - reconnection status is visible in the view
      this.buttonStates['reconnect'] = 'unpressed';
    }
  }

  async leaveSession(): Promise<void> {
    this.buttonStates['leave'] = 'pressed';
    
    const confirmed = confirm('Are you sure you want to leave the quiz session?');
    if (confirmed) {
      this.socketService.leaveSession();
      this.authService.clearSession();
      this.router.navigate(['/join']);
    }
    
    setTimeout(() => {
      this.buttonStates['leave'] = 'unpressed';
    }, 200);
  }

  // Feedback methods removed - notifications are redundant with view state

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
    if (event.key === 'Escape' && this.sessionEnded) {
      this.leaveSession();
    }
  }

  // Card hover animations
  onCardHover(cardId: string, isHovered: boolean): void {
    if (!this.isReducedMotion) {
      this.cardStates[cardId] = isHovered ? 'hovered' : 'normal';
    }
  }
}
