import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuizService } from '../../services/quiz.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { QuizSession } from '../../models/quiz-session.model';
import { Question } from '../../models/question.model';
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
              <app-qr-code 
                [sessionCode]="currentSession.code"
                [sessionName]="currentSession.name"
                (qrGenerated)="onQrGenerated($event)"
                (error)="onQrError($event)">
              </app-qr-code>
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
                             <div class="quiz-header" *ngIf="!showReview && !showLeaderboard">
                <h3>Round {{ currentSession.current_round }} - Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</h3>
                <div class="quiz-status">
                  <span class="status-badge" [class]="getQuizStatusClass()">
                    {{ getQuizStatusText() }}
                  </span>
                </div>
              </div>

                             <!-- Current Question Display -->
                               <div class="current-question" *ngIf="currentQuestion && !showReview && !showLeaderboard">
                                   <app-question-display
                    [question]="currentQuestion"
                    [isActive]="isQuestionActive"
                    [showCorrectAnswer]="showReview"
                    [submissionsReceived]="submissionsReceived"
                    [totalTeams]="teams.length"
                    [canStart]="false"
                    [hasAnswers]="currentAnswers.length > 0"
                    [timeRemaining]="timeRemaining"
                    [totalTime]="currentQuestion.time_limit || 60"
                    [showControls]="true"
                    [isLastQuestion]="currentQuestionIndex === questions.length - 1"
                    (startQuestion)="startQuestion()"
                    (endQuestion)="endQuestion()"
                    (showReview)="showQuestionReview()"
                    (endRound)="endRound()"
                    (onTimeUp)="onTimeUp()"
                    (onTimeChanged)="onTimeChanged($event)">
                  </app-question-display>
               </div>

              <!-- Question Navigation -->
              <div class="question-navigation" *ngIf="!isQuestionActive && !showReview && !showLeaderboard">
                <div class="nav-buttons">
                  <button 
                    mat-stroked-button 
                    (click)="previousQuestion()" 
                    [disabled]="currentQuestionIndex === 0">
                    <mat-icon>arrow_back</mat-icon>
                    Previous Question
                  </button>
                  
                  <button 
                    mat-raised-button 
                    color="primary" 
                    (click)="startQuestion()"
                    [disabled]="!currentQuestion">
                    <mat-icon>play_arrow</mat-icon>
                    Start Question
                  </button>
                  
                  <button 
                    mat-stroked-button 
                    (click)="nextQuestion()" 
                    [disabled]="currentQuestionIndex === questions.length - 1"
                    *ngIf="currentQuestionIndex < questions.length - 1">
                    Next Question
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                  
                  <button 
                    mat-raised-button 
                    color="accent" 
                    (click)="endRound()"
                    *ngIf="currentQuestionIndex === questions.length - 1">
                    <mat-icon>flag</mat-icon>
                    End Round & Review
                  </button>
                </div>
              </div>

              <!-- Review Section -->
              <div class="review-section" *ngIf="showReview && currentQuestion">
                <app-answer-review
                  [question]="currentQuestion"
                  [answers]="currentAnswers"
                  [isLastQuestion]="currentQuestionIndex === questions.length - 1"
                  [isLoading]="isLoadingAnswers"
                  (scoreAnswer)="scoreAnswer($event.answerId, $event.points, $event.isCorrect)"
                  (nextQuestion)="nextReviewQuestion()"
                  (showLeaderboard)="showLeaderboardView()">
                </app-answer-review>
              </div>

              <!-- Leaderboard Section -->
              <div class="leaderboard-section" *ngIf="showLeaderboard">
                <app-leaderboard
                  [teams]="leaderboardTeams"
                  [currentRound]="currentSession.current_round || 1">
                </app-leaderboard>
                
                <div class="leaderboard-actions" *ngIf="currentSession">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    (click)="startNextRound()">
                    <mat-icon>play_arrow</mat-icon>
                    Start Next Round
                  </button>
                </div>
              </div>
            </div>
        </div>

        <!-- Final Leaderboard (shown after session ends) -->
        <div class="final-leaderboard-section" *ngIf="showLeaderboard && !currentSession">
          <div class="final-leaderboard-card">
            <h2>🏆 Final Results</h2>
            <app-leaderboard
              [teams]="leaderboardTeams"
              [currentRound]="1">
            </app-leaderboard>
            
            <div class="final-leaderboard-actions">
              <button 
                mat-raised-button 
                color="primary" 
                (click)="createNewSession()">
                <mat-icon>add</mat-icon>
                Create New Session
              </button>
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
      margin-bottom: 30px;
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

      .quiz-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .quiz-header h3 {
        margin: 0;
        color: #333;
      }

      .status-badge {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .status-badge.waiting {
        background: #fff3cd;
        color: #856404;
      }

      .status-badge.active {
        background: #d4edda;
        color: #155724;
      }

      .status-badge.review {
        background: #cce5ff;
        color: #004085;
      }

      .status-badge.leaderboard {
        background: #f8d7da;
        color: #721c24;
      }

      .question-navigation {
        margin-top: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .nav-buttons {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }

      .nav-buttons button {
        flex: 1;
        padding: 12px 20px;
        font-size: 1rem;
      }

      .end-round-section {
        margin-top: 20px;
        text-align: center;
      }

      .end-round-section button {
        padding: 16px 32px;
        font-size: 1.1rem;
      }

      .leaderboard-actions {
        margin-top: 20px;
        text-align: center;
      }

      .leaderboard-actions button {
        padding: 16px 32px;
        font-size: 1.1rem;
      }

      .final-leaderboard-section {
        margin-top: 30px;
      }

      .final-leaderboard-card {
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        text-align: center;
      }

      .final-leaderboard-card h2 {
        margin-bottom: 30px;
        color: #333;
        font-size: 2rem;
      }

      .final-leaderboard-actions {
        margin-top: 30px;
      }

      .final-leaderboard-actions button {
        padding: 16px 32px;
        font-size: 1.1rem;
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

      .nav-buttons {
        flex-direction: column;
      }

      .nav-buttons button {
        width: 100%;
      }

      .quiz-header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
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
  leaderboardTeams: any[] = [];
  
  // Quiz state
  questions: Question[] = [];
  currentQuestion?: Question;
  currentQuestionIndex = 0;
  isQuestionActive = false;
  timeRemaining = 0;
  submissionsReceived = 0;
  showReview = false;
  showLeaderboard = false;
  currentAnswers: any[] = [];
  isLoadingAnswers = false;
  
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
      }),

      // Subscribe to leaderboard updates
      this.socketService.leaderboardUpdated$.subscribe(event => {
        console.log('📊 Leaderboard updated via socket:', event);
        if (this.currentSession && this.showLeaderboard) {
          this.leaderboardTeams = event.teams;
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
      next: (response) => {
        this.snackBar.open('Session ended successfully', 'Close', {
          duration: 3000
        });
        
        // Show final leaderboard and keep it displayed
        if (response.teams) {
          this.leaderboardTeams = response.teams;
          this.showLeaderboard = true;
          this.showReview = false;
          this.isQuestionActive = false;
          
          // Clear current session but keep leaderboard visible
          this.currentSession = null;
          this.createForm.reset();
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to end session', 'Close', {
          duration: 5000
        });
      }
    });
  }

  createNewSession(): void {
    this.showLeaderboard = false;
    this.leaderboardTeams = [];
    this.createForm.reset();
  }

  // Quiz Management Methods
  loadSampleQuestions(): void {
    if (!this.currentSession) return;

    // Check if questions already exist for this round
    if (this.questions.length > 0) {
      this.snackBar.open('Questions already loaded for this round!', 'Close', {
        duration: 3000
      });
      return;
    }

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
        sequenceItems: question.sequence_items,
        mediaUrl: question.media_url,
        numericalAnswer: question.numerical_answer,
        numericalTolerance: question.numerical_tolerance
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
        this.leaderboardTeams = response.teams;
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

  onQrError(error: string): void {
    console.error('QR code error:', error);
    this.snackBar.open(`QR code error: ${error}`, 'Close', {
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
          this.currentAnswers = response.answers || [];
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopTimer();
  }
}
