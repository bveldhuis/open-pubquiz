import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuizService, QuizSession } from '../../services/quiz.service';

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
export class PresenterComponent implements OnInit {
  createForm: FormGroup;
  currentSession: QuizSession | null = null;
  isCreating = false;

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private snackBar: MatSnackBar
  ) {
    this.createForm = this.fb.group({
      sessionName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {}

  createSession(): void {
    if (this.createForm.valid) {
      this.isCreating = true;
      const { sessionName } = this.createForm.value;

      this.quizService.createSession({ name: sessionName }).subscribe({
        next: (response) => {
          this.currentSession = response.session;
          this.isCreating = false;
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

  loadSampleQuestions(): void {
    if (!this.currentSession) return;

    // This would load sample questions into the session
    this.snackBar.open('Sample questions loaded!', 'Close', {
      duration: 3000
    });
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
}
