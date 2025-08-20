import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuizService, QuizSession } from '../../services/quiz.service';
import { QuizManagementService, Question } from '../../services/quiz-management.service';
import { SocketService } from '../../services/socket.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-presenter',
  template: `
    <div class="container">
      <div class="presenter-content">
        <h1 class="presenter-title">Quiz Presenter</h1>
        
        <!-- Create Session Form -->
        <div *ngIf="!currentSession" class="create-session-card">
          <h2>Create New Quiz Session</h2>
          <form [formGroup]="createForm" (ngSubmit)="createSession()" class="create-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Session Name</mat-label>
              <input matInput formControlName="sessionName" placeholder="Enter session name">
              <mat-error *ngIf="createForm.get('sessionName')?.hasError('required')">
                Session name is required
              </mat-error>
            </mat-form-field>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              class="create-button"
              [disabled]="createForm.invalid || isCreating">
              <mat-spinner *ngIf="isCreating" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!isCreating">Create Session</span>
            </button>
          </form>
        </div>

        <!-- Session Management -->
        <div *ngIf="currentSession" class="session-management">
          <div class="session-info-card">
            <h2>Session: {{ currentSession.name }}</h2>
            
            <div class="connection-status">
              <mat-icon [class]="isConnected ? 'connected' : 'disconnected'">
                {{ isConnected ? 'wifi' : 'wifi_off' }}
              </mat-icon>
              <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
            </div>
            
            <div class="session-code">
              <span class="code-label">Session Code:</span>
              <span class="code-value">{{ currentSession.code }}</span>
            </div>
            
            <div class="qr-section">
              <h3>QR Code for Participants</h3>
              <div class="qr-code" *ngIf="currentSession.qrCode">
                <img [src]="currentSession.qrCode" alt="QR Code" class="qr-image">
              </div>
              <p class="qr-instructions">
                Participants can scan this QR code or go to: 
                <strong>{{ getJoinUrl() }}</strong>
              </p>
            </div>

            <div class="session-stats">
              <div class="stat-item">
                <span class="stat-label">Status:</span>
                <span class="stat-value" [class]="currentSession.status">
                  {{ currentSession.status | titlecase }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Current Round:</span>
                <span class="stat-value">{{ currentSession.current_round }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Teams Joined:</span>
                <span class="stat-value">{{ teams.length }}</span>
              </div>
            </div>

            <div class="teams-section" *ngIf="teams.length > 0">
              <h3>Teams in Session</h3>
              <div class="teams-list">
                <div class="team-item" *ngFor="let team of teams">
                  <mat-icon>group</mat-icon>
                  <span>{{ team.name }}</span>
                </div>
              </div>
            </div>
          </div>

                     <div class="action-buttons">
             <button mat-raised-button color="accent" (click)="loadSampleQuestions()">
               <mat-icon>quiz</mat-icon>
               Load Sample Questions
             </button>
             
             <button mat-raised-button color="warn" (click)="endSession()">
               <mat-icon>stop</mat-icon>
               End Session
             </button>
           </div>

           <!-- Quiz Management Section -->
           <div class="quiz-management" *ngIf="questions.length > 0">
             <h3>Quiz Management</h3>
             
             <!-- Questions List -->
             <div class="questions-list">
               <div class="question-item" *ngFor="let question of questions">
                 <app-question-display
                   [question]="question"
                   [isActive]="isQuestionActive && currentQuestion?.id === question.id"
                   [showCorrectAnswer]="showReview"
                   [submissionsReceived]="submissionsReceived"
                   [totalTeams]="teams.length"
                   [canStart]="!isQuestionActive"
                   [hasAnswers]="currentAnswers.length > 0"
                   (startQuestion)="startQuestion($event)"
                   (endQuestion)="endQuestion()"
                   (showReview)="showQuestionReview($event)">
                 </app-question-display>
               </div>
             </div>

             <!-- Review Section -->
             <div class="review-section" *ngIf="showReview && currentQuestion">
               <app-answer-review
                 [question]="currentQuestion"
                 [answers]="currentAnswers"
                 (scoreAnswer)="scoreAnswer($event.answerId, $event.points, $event.isCorrect)"
                 (showLeaderboard)="showLeaderboardView()"
                 (nextQuestion)="nextRound()">
               </app-answer-review>
             </div>

             <!-- Leaderboard Section -->
             <div class="leaderboard-section" *ngIf="showLeaderboard">
               <app-leaderboard
                 [teams]="teams"
                 [currentRound]="currentSession.current_round">
               </app-leaderboard>
             </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .presenter-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .presenter-title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      color: #333;
    }

    .create-session-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .create-session-card h2 {
      margin-bottom: 30px;
      color: #333;
    }

    .create-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .create-button {
      padding: 12px;
      font-size: 1.1rem;
    }

    .spinner {
      margin-right: 8px;
    }

    .session-management {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .session-info-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .session-info-card h2 {
      margin-bottom: 20px;
      color: #333;
    }

    .session-code {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .code-label {
      font-weight: 500;
      color: #666;
    }

    .code-value {
      font-size: 2rem;
      font-weight: bold;
      color: #3f51b5;
      letter-spacing: 4px;
    }

    .qr-section {
      text-align: center;
      margin-bottom: 30px;
    }

    .qr-section h3 {
      margin-bottom: 20px;
      color: #333;
    }

    .qr-code {
      margin-bottom: 20px;
    }

    .qr-image {
      max-width: 200px;
      height: auto;
    }

    .qr-instructions {
      color: #666;
      font-size: 0.9rem;
    }

    .session-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-label {
      font-weight: 500;
      color: #666;
    }

    .stat-value {
      font-weight: bold;
      color: #333;
    }

    .stat-value.waiting {
      color: #ff9800;
    }

    .stat-value.active {
      color: #4caf50;
    }

    .stat-value.paused {
      color: #2196f3;
    }

    .stat-value.finished {
      color: #f44336;
    }

    .action-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-buttons button {
      padding: 12px 24px;
      font-size: 1rem;
    }

    .action-buttons mat-icon {
      margin-right: 8px;
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
      margin-bottom: 20px;
    }

    .connection-status mat-icon.connected {
      color: #4caf50;
    }

    .connection-status mat-icon.disconnected {
      color: #f44336;
    }

    .teams-section {
      margin-top: 30px;
    }

    .teams-section h3 {
      margin-bottom: 15px;
      color: #333;
    }

    .teams-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .team-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

         .team-item mat-icon {
       color: #4caf50;
     }

     .quiz-management {
       margin-top: 30px;
     }

     .quiz-management h3 {
       margin-bottom: 20px;
       color: #333;
       font-size: 1.5rem;
     }

     .questions-list {
       display: flex;
       flex-direction: column;
       gap: 20px;
     }

     .question-item {
       margin-bottom: 20px;
     }

     .review-section,
     .leaderboard-section {
       margin-top: 30px;
     }

    @media (max-width: 768px) {
      .presenter-content {
        padding: 10px;
      }

      .create-session-card,
      .session-info-card {
        padding: 20px;
      }

      .code-value {
        font-size: 1.5rem;
        letter-spacing: 2px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-buttons button {
        width: 100%;
      }
    }
  `]
})
export class PresenterComponent implements OnInit, OnDestroy {
  createForm: FormGroup;
  currentSession: QuizSession | null = null;
  isCreating = false;
  isConnected = false;
  teams: any[] = [];
  
  // Quiz state
  questions: Question[] = [];
  currentQuestion?: Question;
  isQuestionActive = false;
  timeRemaining = 0;
  submissionsReceived = 0;
  showReview = false;
  showLeaderboard = false;
  currentAnswers: any[] = [];
  
  private subscriptions: Subscription[] = [];
  private timerSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private quizManagementService: QuizManagementService,
    public socketService: SocketService,
    private snackBar: MatSnackBar
  ) {
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
              name: event.teamName
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
          this.teams = event.teams;
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
            const newAnswer = {
              id: `${event.teamId}-${event.questionId}`,
              teamId: event.teamId,
              teamName: event.teamName,
              questionId: event.questionId,
              answer: 'Submitted', // We don't have the actual answer text here
              submittedAt: new Date()
            };
            
            // Check if this team has already answered this question
            const existingAnswer = this.currentAnswers.find(a => a.teamId === event.teamId && a.questionId === event.questionId);
            if (!existingAnswer) {
              this.currentAnswers.push(newAnswer);
              this.submissionsReceived = this.currentAnswers.length; // Update the counter
              console.log(`📝 Added answer from ${event.teamName} to current answers. Total: ${this.currentAnswers.length}`);
            } else {
              console.log(`📝 Team ${event.teamName} already answered this question`);
            }
          }
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
          this.teams = []; // Reset teams list
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
        error: (error) => {
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
      next: () => {
        this.snackBar.open('Session ended successfully', 'Close', {
          duration: 3000
        });
        this.currentSession = null;
        this.createForm.reset();
      },
      error: (error) => {
        this.snackBar.open('Failed to end session', 'Close', {
          duration: 5000
        });
      }
    });
  }

  getJoinUrl(): string {
    return `${window.location.origin}/join?code=${this.currentSession?.code}`;
  }

  // Quiz Management Methods
  loadSampleQuestions(): void {
    if (!this.currentSession) return;

    const roundNumber = this.currentSession.current_round || 1;
    const sampleQuestions = this.quizManagementService.getSampleQuestions(roundNumber);
    
    // Create questions in the database
    const createPromises = sampleQuestions.map((question, index) => {
      return this.quizManagementService.createQuestion({
        sessionCode: this.currentSession!.code,
        roundNumber: question.round_number,
        questionNumber: question.question_number,
        type: question.type,
        questionText: question.question_text,
        funFact: question.fun_fact,
        timeLimit: question.time_limit,
        points: question.points,
        options: question.options,
        correctAnswer: question.correct_answer,
        sequenceItems: question.sequence_items
      }).toPromise();
    });

    Promise.all(createPromises).then(() => {
      this.loadQuestionsForCurrentRound();
      this.snackBar.open('Sample questions loaded successfully!', 'Close', {
        duration: 3000
      });
    }).catch(error => {
      console.error('Error loading sample questions:', error);
      this.snackBar.open('Failed to load sample questions', 'Close', {
        duration: 5000
      });
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

  startQuestion(questionId: string): void {
    if (!this.currentSession) return;

    this.quizManagementService.startQuestion(this.currentSession.code, questionId).subscribe({
      next: () => {
        this.currentQuestion = this.questions.find(q => q.id === questionId);
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

  showQuestionReview(questionId: string): void {
    if (!this.currentSession) return;

    // Load answers for the question
    this.quizManagementService.getAnswersForQuestion(questionId).subscribe({
      next: (response) => {
        this.currentAnswers = response.answers;
        this.showReview = true;
        this.showLeaderboard = false;
        this.currentQuestion = this.questions.find(q => q.id === questionId);
        
        this.snackBar.open('Review mode activated', 'Close', {
          duration: 2000
        });
      },
      error: (error) => {
        console.error('Error loading answers:', error);
        this.snackBar.open('Failed to load answers', 'Close', {
          duration: 5000
        });
      }
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
    
    // Use Socket.IO to show leaderboard
    if (this.currentSession) {
      this.socketService.showLeaderboard(this.currentSession.code);
    }
    
    this.snackBar.open('Leaderboard displayed', 'Close', {
      duration: 2000
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopTimer();
  }
}
