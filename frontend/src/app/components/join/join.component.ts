import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuizService } from '../../services/quiz.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-join',
  template: `
    <div class="container">
      <div class="join-card">
        <h1 class="join-title">Join Quiz Session</h1>
        
        <form [formGroup]="joinForm" (ngSubmit)="onSubmit()" class="join-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Session Code</mat-label>
            <input matInput formControlName="sessionCode" placeholder="Enter session code">
            <mat-error *ngIf="joinForm.get('sessionCode')?.hasError('required')">
              Session code is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Team Name</mat-label>
            <input matInput formControlName="teamName" placeholder="Enter your team name">
            <mat-error *ngIf="joinForm.get('teamName')?.hasError('required')">
              Team name is required
            </mat-error>
            <mat-error *ngIf="joinForm.get('teamName')?.hasError('minlength')">
              Team name must be at least 2 characters
            </mat-error>
          </mat-form-field>

          <button 
            mat-raised-button 
            color="primary" 
            type="submit" 
            class="join-button"
            [disabled]="joinForm.invalid || isLoading">
            <mat-spinner *ngIf="isLoading" diameter="20" class="spinner"></mat-spinner>
            <span *ngIf="!isLoading">Join Session</span>
          </button>
        </form>

        <div class="join-info">
          <p>Don't have a session code? Ask your quiz presenter for the code.</p>
          <p>The session code is usually displayed on the presenter's screen.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .join-card {
      max-width: 400px;
      margin: 60px auto;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .join-title {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 30px;
      color: #333;
    }

    .join-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .join-button {
      padding: 12px;
      font-size: 1.1rem;
      margin-top: 10px;
    }

    .spinner {
      margin-right: 8px;
    }

    .join-info {
      margin-top: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      text-align: center;
    }

    .join-info p {
      margin: 8px 0;
      color: #666;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .join-card {
        margin: 20px;
        padding: 30px;
      }
    }
  `]
})
export class JoinComponent implements OnInit {
  joinForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.joinForm = this.fb.group({
      sessionCode: ['', [Validators.required]],
      teamName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    // Check if session code is provided in URL
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.joinForm.patchValue({
          sessionCode: params['code']
        });
      }
    });
  }

  onSubmit(): void {
    if (this.joinForm.valid) {
      this.isLoading = true;
      const { sessionCode, teamName } = this.joinForm.value;

      this.quizService.joinSession({ sessionCode, teamName }).subscribe({
        next: (response) => {
          // Set user session
          this.authService.setUserSession({
            teamId: response.team.id,
            teamName: response.team.name,
            sessionCode: sessionCode
          });

          this.snackBar.open(`Successfully joined as ${teamName}!`, 'Close', {
            duration: 3000
          });

          // Navigate to participant view
          this.router.navigate(['/participant']);
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Failed to join session';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000
          });
        }
      });
    }
  }
}
