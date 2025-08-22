import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TitleCasePipe } from '@angular/common';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';
import { QuestionDisplayComponent } from '../question/display/question-display/question-display.component';

import { SessionConfigComponent } from '../session-config/session-config.component';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { AnswerReviewComponent } from '../answer-review/answer-review.component';
import { QuizService } from '../../services/quiz.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { QuizSession } from '../../models/quiz-session.model';
import { SessionConfiguration } from '../../models/session-configuration.model';
import { Question } from '../../models/question.model';

import { SocketService } from '../../services/socket.service';
import { Subscription, interval } from 'rxjs';

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
    templateUrl: './presenter.component.html',
    styleUrls: ['./presenter.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        TitleCasePipe,
        LeaderboardComponent,
        QuestionDisplayComponent,
        SessionConfigComponent,
        QrCodeComponent,
        AnswerReviewComponent
    ]
})
export class PresenterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private quizService = inject(QuizService);
  private quizManagementService = inject(QuizManagementService);
  private socketService = inject(SocketService);
  createForm: FormGroup;
  currentSession: QuizSession | null = null;
  isCreating = false;
  isConnected = false;
  teams: TeamInfo[] = [];
  leaderboardTeams: TeamInfo[] = [];
  
  // Quiz state
  questions: Question[] = [];
  currentQuestion?: Question;
  currentQuestionIndex = 0;
  isQuestionActive = false;
  timeRemaining = 0;
  submissionsReceived = 0;
  showReview = false;
  showLeaderboard = false;
  currentAnswers: AnswerInfo[] = [];
  isLoadingAnswers = false;
  sessionConfiguration: SessionConfiguration | null = null;
  showConfigurationForm = false;
  
  private subscriptions: Subscription[] = [];
  private timerSubscription?: Subscription;

  constructor() {
this.createForm = this.fb.group({
sessionName: ['', [Validators.required, Validators.minLength(3)]]
  });
  }

  ngOnInit(): void {
    // Connect to Socket.IO
    this.socketService.connect();

    // Subscribe to connection status
    this.subscriptions.push(
      this.socketService.connectionStatus$.subscribe(connected => {
        this.isConnected = connected;
        console.log('Presenter socket connection status:', connected);
      })
    );

    // Subscribe to team join events
    this.subscriptions.push(
      this.socketService.teamJoinedSession$.subscribe(event => {
        console.log('🎮 Presenter received team joined session event:', event);
        if (this.currentSession) {
          // Add team to the list if it's not already there
          const existingTeam = this.teams.find(t => t.id === event.teamId);
          if (!existingTeam) {
            this.teams.push({
              id: event.teamId,
              name: event.teamName,
              total_points: 0,
              answers_submitted: 0,
              correct_answers: 0
            });
            console.log('🎮 Added team to list:', event.teamName);
          } else {
            console.log('🎮 Team already exists in list:', event.teamName);
          }
          
          this.snackBar.open(`Team ${event.teamName} joined the session!`, 'Close', {
            duration: 3000
          });
        } else {
          console.log('🎮 No current session, ignoring team join event');
        }
      }),

      this.socketService.existingTeams$.subscribe(event => {
        if (this.currentSession) {
          console.log('📋 Loading existing teams:', event.teams);
          this.teams = event.teams as TeamInfo[];
          if (event.teams.length > 0) {
            this.snackBar.open(`${event.teams.length} existing teams loaded!`, 'Close', {
              duration: 3000
            });
          }
        }
      }),

      // Subscribe to answer received events
      this.socketService.answerReceived$.subscribe(event => {
        console.log('📨 Answer received:', event);
        console.log('📨 Current question ID:', this.currentQuestion?.id);
        console.log('📨 Event question ID:', event.questionId);
        if (this.currentSession && this.currentQuestion && event.questionId === this.currentQuestion.id) {
          console.log('📨 Condition met - processing answer');
          // Add the answer to the current answers list
          const team = this.teams.find(t => t.id === event.teamId);
          if (team) {
            const newAnswer: AnswerInfo = {
              id: `${event.teamId}-${event.questionId}`,
              team_id: event.teamId,
              question_id: event.questionId,
              answer_text: 'Submitted', // We don't have the actual answer text here
              points_awarded: 0,
              submitted_at: new Date().toISOString()
            };
            
            // Check if this team has already answered this question
            const existingAnswer = this.currentAnswers.find(a => a.team_id === event.teamId && a.question_id === event.questionId);
            if (!existingAnswer) {
              this.currentAnswers.push(newAnswer);
              this.submissionsReceived = this.currentAnswers.length; // Update the counter
              console.log(`📝 Added answer from ${event.teamName} to current answers. Total: ${this.currentAnswers.length}`);
            } else {
              console.log(`📝 Team ${event.teamName} already answered this question`);
            }
          }
        }
      }),

      // Subscribe to leaderboard updates
      this.socketService.leaderboardUpdated$.subscribe(event => {
        console.log('📊 Leaderboard updated via socket:', event);
        if (this.currentSession && this.showLeaderboard) {
          this.leaderboardTeams = event.teams as TeamInfo[];
        }
      })
    );
  }



  createSession(): void {
    if (this.createForm.valid) {
      this.isCreating = true;
      const { sessionName } = this.createForm.value;

      this.quizService.createSession({ name: sessionName }).subscribe({
        next: (response) => {
          this.currentSession = response.session;
          
          // Reset all session-related state
          this.teams = [];
          this.leaderboardTeams = [];
          this.questions = [];
          this.currentQuestion = undefined;
          this.currentQuestionIndex = 0;
          this.isQuestionActive = false;
          this.timeRemaining = 0;
          this.submissionsReceived = 0;
          this.showReview = false;
          this.showLeaderboard = false;
          this.currentAnswers = [];
          this.isLoadingAnswers = false;
          this.sessionConfiguration = null;
          this.showConfigurationForm = false;
          
          this.isCreating = false;
          
          // Join the socket room for this session
          console.log('Session created, joining room:', this.currentSession.code);
          if (this.socketService.isConnected()) {
            this.socketService.joinRoom(this.currentSession.code);
          } else {
            console.error('Socket not connected, cannot join room');
          }
          
          this.snackBar.open('Session created successfully!', 'Close', {
            duration: 3000
          });
        },
        error: () => {
          this.isCreating = false;
          this.snackBar.open('Failed to create session', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }



  endSession(): void {
    if (!this.currentSession) return;

    this.quizService.endSession(this.currentSession.code).subscribe({
      next: (response) => {
        this.snackBar.open('Session ended successfully', 'Close', {
          duration: 3000
        });
        
        // Show final leaderboard and keep it displayed
        if (response.teams) {
          this.leaderboardTeams = response.teams as TeamInfo[];
          this.showLeaderboard = true;
          this.showReview = false;
          this.isQuestionActive = false;
          
          // Clear current session but keep leaderboard visible
          this.currentSession = null;
          this.createForm.reset();
        }
      },
      error: () => {
        this.snackBar.open('Failed to end session', 'Close', {
          duration: 5000
        });
      }
    });
  }

  createNewSession(): void {
    // Reset all session-related state
    this.currentSession = null;
    this.teams = [];
    this.leaderboardTeams = [];
    this.questions = [];
    this.currentQuestion = undefined;
    this.currentQuestionIndex = 0;
    this.isQuestionActive = false;
    this.timeRemaining = 0;
    this.submissionsReceived = 0;
    this.showReview = false;
    this.showLeaderboard = false;
    this.currentAnswers = [];
    this.isLoadingAnswers = false;
    this.sessionConfiguration = null;
    this.showConfigurationForm = false;
    
    this.createForm.reset();
  }

  // Session Configuration Methods
  showSessionConfiguration(): void {
    this.showConfigurationForm = true;
  }

  onSessionConfigured(configuration: SessionConfiguration): void {
    this.sessionConfiguration = configuration;
    this.showConfigurationForm = false;
    this.snackBar.open('Session configured successfully!', 'Close', {
      duration: 3000
    });
  }

  onConfigurationCancelled(): void {
    this.showConfigurationForm = false;
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

  generateQuestionsForCurrentRound(): void {
    if (!this.currentSession || !this.sessionConfiguration) return;

    const roundNumber = this.currentSession.current_round || 1;
    
    this.quizManagementService.generateQuestionsForRound(this.currentSession.code, roundNumber).subscribe({
      next: (response) => {
        this.questions = response.questions;
        if (this.questions.length > 0) {
          this.currentQuestionIndex = 0;
          this.currentQuestion = this.questions[0];
          this.currentAnswers = [];
          this.submissionsReceived = 0;
          this.showReview = false;
          this.showLeaderboard = false;
          this.isQuestionActive = false;
        }
        this.snackBar.open(`Generated ${this.questions.length} questions for round ${roundNumber}!`, 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error generating questions:', error);
        this.snackBar.open('Failed to generate questions', 'Close', {
          duration: 5000
        });
      }
    });
  }



  loadQuestionsForCurrentRound(): void {
    if (!this.currentSession) return;

    this.quizManagementService.getQuestionsForSession(
      this.currentSession.code, 
      this.currentSession.current_round
    ).subscribe({
      next: (response) => {
        this.questions = response.questions;
        // Set the first question as current
        if (this.questions.length > 0) {
          this.currentQuestionIndex = 0;
          this.currentQuestion = this.questions[0];
          this.currentAnswers = [];
          this.submissionsReceived = 0;
          this.showReview = false;
          this.showLeaderboard = false;
          this.isQuestionActive = false;
        }
        console.log('Loaded questions:', this.questions);
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.snackBar.open('Failed to load questions', 'Close', {
          duration: 5000
        });
      }
    });
  }

  startQuestion(): void {
    if (!this.currentSession || !this.currentQuestion) return;

    const questionId = this.currentQuestion.id;
    this.quizManagementService.startQuestion(this.currentSession.code, questionId).subscribe({
      next: () => {
        this.isQuestionActive = true;
        this.timeRemaining = this.currentQuestion?.time_limit || 0;
        this.submissionsReceived = 0;
        this.currentAnswers = []; // Clear previous answers
        this.showReview = false;
        this.showLeaderboard = false;
        
        // Start timer
        this.startTimer();
        
        // Use Socket.IO to start question
        console.log('Starting question via socket:', this.currentSession!.code, questionId);
        this.socketService.startQuestion(this.currentSession!.code, questionId);
        
        this.snackBar.open('Question started!', 'Close', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error starting question:', error);
        this.snackBar.open('Failed to start question', 'Close', {
          duration: 5000
        });
      }
    });
  }

  endQuestion(): void {
    if (!this.currentSession) return;

    this.quizManagementService.endQuestion(this.currentSession.code).subscribe({
      next: () => {
        this.isQuestionActive = false;
        this.stopTimer();
        
        // Use Socket.IO to end question
        this.socketService.endQuestion(this.currentSession!.code);
        
        this.snackBar.open('Question ended!', 'Close', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error ending question:', error);
        this.snackBar.open('Failed to end question', 'Close', {
          duration: 5000
        });
      }
    });
  }

  showQuestionReview(): void {
    if (!this.currentSession || !this.currentQuestion) return;

    this.loadAnswersForCurrentQuestion();
    this.showReview = true;
    this.showLeaderboard = false;
    
    this.snackBar.open('Review mode activated', 'Close', {
      duration: 2000
    });
  }

  scoreAnswer(answerId: string, points: number, isCorrect: boolean): void {
    this.quizManagementService.scoreAnswer(answerId, points, isCorrect).subscribe({
      next: () => {
        // Update the answer in the local array
        const answer = this.currentAnswers.find(a => a.id === answerId);
        if (answer) {
          answer.points_awarded = points;
          answer.is_correct = isCorrect;
        }
        
        // Refresh leaderboard data if currently showing
        if (this.showLeaderboard && this.currentSession) {
          this.refreshLeaderboard();
        }
        
        this.snackBar.open('Answer scored!', 'Close', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error scoring answer:', error);
        this.snackBar.open('Failed to score answer', 'Close', {
          duration: 5000
        });
      }
    });
  }

  showLeaderboardView(): void {
    this.showReview = false;
    this.showLeaderboard = true;
    
    // Load leaderboard data
    this.refreshLeaderboard();
    
    // Use Socket.IO to show leaderboard
    if (this.currentSession) {
      this.socketService.showLeaderboard(this.currentSession.code);
    }
    
    this.snackBar.open('Leaderboard displayed', 'Close', {
      duration: 2000
    });
  }

  private refreshLeaderboard(): void {
    if (!this.currentSession) return;
    
    this.quizService.getLeaderboard(this.currentSession.code).subscribe({
      next: (response) => {
        this.leaderboardTeams = response.teams.map(team => ({
          id: team.id,
          name: team.name,
          total_points: team.total_points || 0,
          answers_submitted: 0, // Default value since Team model doesn't have this
          correct_answers: 0 // Default value since Team model doesn't have this
        }));
        console.log('Leaderboard data refreshed:', this.leaderboardTeams);
      },
      error: (error) => {
        console.error('Error refreshing leaderboard:', error);
        this.snackBar.open('Failed to refresh leaderboard data', 'Close', {
          duration: 5000
        });
      }
    });
  }

  nextRound(): void {
    if (!this.currentSession) return;

    this.quizManagementService.nextRound(this.currentSession.code).subscribe({
      next: () => {
        this.showReview = false;
        this.showLeaderboard = false;
        this.currentQuestion = undefined;
        this.isQuestionActive = false;
        this.currentAnswers = [];
        
        // Update session info
        this.currentSession!.current_round = (this.currentSession!.current_round || 1) + 1;
        
        // Load questions for the new round
        this.loadQuestionsForCurrentRound();
        
        // Use Socket.IO to start next round
        this.socketService.nextRound(this.currentSession!.code);
        
        this.snackBar.open('Next round started!', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error starting next round:', error);
        this.snackBar.open('Failed to start next round', 'Close', {
          duration: 5000
        });
      }
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

  onTimeUp(): void {
    console.log('Time is up!');
    this.endQuestion();
  }

  onTimeChanged(timeRemaining: number): void {
    this.timeRemaining = timeRemaining;
  }

  onQrGenerated(joinUrl: string): void {
    console.log('QR code generated:', joinUrl);
    this.snackBar.open('QR code generated successfully!', 'Close', {
      duration: 2000
    });
  }

  onQrError(error: string | ErrorEvent): void {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    console.error('QR code error:', errorMessage);
    this.snackBar.open(`QR code error: ${errorMessage}`, 'Close', {
      duration: 5000
    });
  }

  // Question Navigation Methods
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.currentAnswers = [];
      this.submissionsReceived = 0;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.currentAnswers = [];
      this.submissionsReceived = 0;
    }
  }

  endRound(): void {
    // Start review mode from the first question
    this.currentQuestionIndex = 0;
    this.currentQuestion = this.questions[0];
    this.showReview = true;
    this.showLeaderboard = false;
    this.isQuestionActive = false;
    this.stopTimer();
    
    // Load answers for the first question
    this.loadAnswersForCurrentQuestion();
    
    this.snackBar.open('Round ended. Starting answer review...', 'Close', {
      duration: 3000
    });
  }

  nextReviewQuestion(): void {
    console.log('nextReviewQuestion called. Current index:', this.currentQuestionIndex, 'Total questions:', this.questions.length);
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.loadAnswersForCurrentQuestion();
      console.log('Moved to next question. New index:', this.currentQuestionIndex);
    } else {
      // Last question reviewed, show leaderboard
      console.log('Last question reviewed, showing leaderboard');
      this.showLeaderboardView();
    }
  }

  startNextRound(): void {
    if (!this.currentSession) return;

    this.quizManagementService.nextRound(this.currentSession.code).subscribe({
      next: (response) => {
        this.showReview = false;
        this.showLeaderboard = false;
        this.currentQuestionIndex = 0;
        this.currentQuestion = undefined;
        this.isQuestionActive = false;
        this.currentAnswers = [];
        this.questions = []; // Clear questions to force reload
        
        // Update session info with the actual round from backend
        if (response.currentRound) {
          this.currentSession!.current_round = response.currentRound;
        }
        
        // Load questions for the new round
        this.loadQuestionsForCurrentRound();
        
        this.snackBar.open('Next round started!', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error starting next round:', error);
        this.snackBar.open('Failed to start next round', 'Close', {
          duration: 5000
        });
      }
    });
  }

  private loadAnswersForCurrentQuestion(): void {
    if (!this.currentQuestion) return;

    this.isLoadingAnswers = true;
    this.quizManagementService.getAnswersForQuestion(this.currentQuestion.id).subscribe({
      next: (response) => {
        try {
          console.log('Answers response:', response);
          this.currentAnswers = (response.answers || []) as AnswerInfo[];
        } catch (error) {
          console.error('Error parsing answers response:', error);
          this.currentAnswers = [];
        }
        this.isLoadingAnswers = false;
      },
      error: (error) => {
        console.error('Error loading answers:', error);
        this.currentAnswers = [];
        this.isLoadingAnswers = false;
      }
    });
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

  isLastRound(): boolean {
    if (!this.currentSession || !this.sessionConfiguration) {
      return false;
    }
    return this.currentSession.current_round >= this.sessionConfiguration.total_rounds;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopTimer();
  }
}
