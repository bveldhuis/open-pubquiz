import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { QuizManagementService, Question } from '../../services/quiz-management.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-participant',
  template: `
    <div class="container">
      <div class="participant-content">
        <div class="team-info">
          <h1>Welcome, {{ teamName }}!</h1>
          <p class="session-info">Session: {{ sessionCode }}</p>
        </div>

        <div class="status-card" *ngIf="!isQuestionActive && !sessionEnded">
          <h2>Waiting for questions...</h2>
          <p>Your presenter will start the quiz soon.</p>
        </div>

        <!-- Session Ended View -->
        <div class="session-ended-card" *ngIf="sessionEnded">
          <h2>🎉 Quiz Session Ended!</h2>
          <p>Thank you for participating in the quiz!</p>
          
          <div class="final-leaderboard" *ngIf="finalLeaderboard.length > 0">
            <h3>🏆 Final Results</h3>
            <div class="leaderboard-list">
              <div class="leaderboard-item" *ngFor="let team of finalLeaderboard; let i = index">
                <div class="rank">{{ i + 1 }}</div>
                <div class="team-name">{{ team.name }}</div>
                <div class="points">{{ team.total_points }} pts</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Display -->
        <app-question-answer
          *ngIf="isQuestionActive && currentQuestion && !sessionEnded"
          [question]="currentQuestion"
          [isActive]="isQuestionActive"
          [isAnswerSubmitted]="answerSubmitted"
          [timeRemaining]="timeRemaining"
          [totalTime]="currentQuestion.time_limit || 60"
          (answerSubmitted)="onAnswerSubmitted($event)"
          (onTimeUp)="onTimeUp()"
          (onTimeChanged)="onTimeChanged($event)">
        </app-question-answer>

        <div class="connection-status">
          <mat-icon [class]="isConnected ? 'connected' : 'disconnected'">
            {{ isConnected ? 'wifi' : 'wifi_off' }}
          </mat-icon>
          <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .team-info {
      text-align: center;
      margin-bottom: 40px;
    }

    .team-info h1 {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 10px;
    }

    .session-info {
      font-size: 1.2rem;
      color: #666;
    }

    .status-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .status-card h2 {
      color: #333;
      margin-bottom: 15px;
    }

    .status-card p {
      color: #666;
      font-size: 1.1rem;
    }

    .connection-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 1rem;
    }

    .connection-status mat-icon.connected {
      color: #4caf50;
    }

    .connection-status mat-icon.disconnected {
      color: #f44336;
    }

    .session-ended-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .session-ended-card h2 {
      color: #333;
      margin-bottom: 15px;
      font-size: 2rem;
    }

    .session-ended-card p {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 30px;
    }

    .final-leaderboard {
      margin-top: 30px;
    }

    .final-leaderboard h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .rank {
      font-weight: bold;
      font-size: 1.2rem;
      color: #4caf50;
      min-width: 40px;
    }

    .team-name {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    .points {
      font-weight: bold;
      color: #4caf50;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .participant-content {
        padding: 10px;
      }

      .team-info h1 {
        font-size: 2rem;
      }

      .status-card {
        padding: 20px;
      }
    }
  `]
})
export class ParticipantComponent implements OnInit, OnDestroy {
  teamName: string = '';
  sessionCode: string = '';
  isConnected: boolean = false;
  
  // Quiz state
  currentQuestion?: Question;
  isQuestionActive = false;
  timeRemaining = 0;
  answerSubmitted = false;
  
  // Session ended state
  sessionEnded = false;
  finalLeaderboard: any[] = [];
  
  private subscriptions: Subscription[] = [];
  private timerSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private quizManagementService: QuizManagementService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/join']);
      return;
    }

    this.teamName = currentUser.teamName;
    this.sessionCode = currentUser.sessionCode;

    // Connect to Socket.IO
    this.socketService.connect();
    
    // Subscribe to connection status changes
    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(connected => {
        this.isConnected = connected;
        console.log('Socket connection status changed:', connected);
        
        // Join session only after connection is established
        if (connected) {
          console.log('Socket connected, joining session...');
          this.socketService.joinSession({
            sessionCode: this.sessionCode,
            teamName: this.teamName
          });
        }
      })
    );

    // Subscribe to Socket.IO events
    this.subscriptions.push(
      this.socketService.teamJoined$.subscribe(event => {
        this.snackBar.open(`Successfully joined session!`, 'Close', {
          duration: 3000
        });
      }),

      this.socketService.error$.subscribe(error => {
        this.snackBar.open(error.message, 'Close', {
          duration: 5000
        });
      }),

      // Subscribe to question events
      this.socketService.questionStarted$.subscribe(event => {
        console.log('Question started event received:', event);
        if (!event.question) {
          console.error('Question is null in event:', event);
          this.snackBar.open('Error: Question data is missing', 'Close', {
            duration: 5000
          });
          return;
        }
        this.currentQuestion = event.question;
        this.isQuestionActive = true;
        this.timeRemaining = event.timeLimit || 0;
        this.answerSubmitted = false;
        this.startTimer();
        
        this.snackBar.open('Question started!', 'Close', {
          duration: 2000
        });
      }),

      this.socketService.questionEnded$.subscribe(() => {
        console.log('Question ended event received');
        this.isQuestionActive = false;
        this.stopTimer();
        
        this.snackBar.open('Question ended!', 'Close', {
          duration: 2000
        });
      }),

      this.socketService.sessionEnded$.subscribe(event => {
        console.log('🏁 Session ended event received:', event);
        this.sessionEnded = true;
        this.isQuestionActive = false;
        this.stopTimer();
        this.finalLeaderboard = event.teams;
        this.snackBar.open('Quiz session has ended!', 'Close', {
          duration: 5000
        });
      }),

      this.socketService.sessionEndedError$.subscribe(event => {
        console.log('🚫 Session ended error received:', event);
        this.snackBar.open(event.message, 'Close', {
          duration: 5000
        });
        // Redirect to join page
        this.router.navigate(['/join']);
      })
    );
    }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopTimer();
    this.socketService.disconnect();
  }

  // Answer submission
  onAnswerSubmitted(answer: string | string[]): void {
    if (!this.currentQuestion || !this.isQuestionActive) return;

    this.socketService.submitAnswer({
      sessionCode: this.sessionCode,
      teamId: this.authService.getCurrentUser()?.teamId || '',
      questionId: this.currentQuestion.id,
      answer: answer
    });

    this.answerSubmitted = true;
    this.snackBar.open('Answer submitted!', 'Close', {
      duration: 2000
    });
  }

  private startTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.stopTimer();
        this.isQuestionActive = false;
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  onTimeUp(): void {
    console.log('Time is up!');
    this.isQuestionActive = false;
    this.stopTimer();
  }

  onTimeChanged(timeRemaining: number): void {
    this.timeRemaining = timeRemaining;
  }
}
