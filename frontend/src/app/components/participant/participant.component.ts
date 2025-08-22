import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { Question } from '../../models/question.model';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss']
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
