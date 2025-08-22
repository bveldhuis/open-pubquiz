import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuizService } from '../../services/quiz.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-join',
    templateUrl: './join.component.html',
    styleUrls: ['./join.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})
export class JoinComponent implements OnInit {
  private fb = inject(FormBuilder);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  joinForm: FormGroup;
  isLoading = false;

  constructor() {
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
