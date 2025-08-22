import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter , inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuizManagementService } from '../../services/quiz-management.service';
import { Theme } from '../../models/theme.model';
import { SessionConfiguration } from '../../models/session-configuration.model';
import { QuestionTypeFormValue, RoundFormValue, SessionConfigFormValue, HttpError } from '../../models/session-config-form.model';

@Component({
    selector: 'app-session-config',
    templateUrl: './session-config.component.html',
    styleUrls: ['./session-config.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ]
})
export class SessionConfigComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private quizManagementService = inject(QuizManagementService);

  @Input() sessionCode = '';
  @Output() configurationComplete = new EventEmitter<SessionConfiguration>();
  @Output() configurationCancelled = new EventEmitter<void>();
  
  configForm: FormGroup;
  themes: Theme[] = [];
  questionTypes = ['multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video'];
  themeQuestionCounts: Record<string, Record<string, number>> = {};
  isConfiguring = false;
  sessionConfiguration: SessionConfiguration | null = null;

  constructor() {
    this.configForm = this.fb.group({
      sessionCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6}$/)]],
      totalRounds: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      roundConfigurations: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadThemes();
    this.watchTotalRounds();
    
    // Initialize with the default number of rounds
    const initialRounds = this.configForm.get('totalRounds')?.value || 1;
    this.updateRoundConfigurations(initialRounds);
    
    // Set the session code if provided
    if (this.sessionCode) {
      this.configForm.patchValue({ sessionCode: this.sessionCode });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionCode'] && !changes['sessionCode'].firstChange) {
      // Reset form when sessionCode changes (new session)
      this.resetForm();
      
      // Set the new session code
      if (this.sessionCode) {
        this.configForm.patchValue({ sessionCode: this.sessionCode });
      }
    }
  }

  private resetForm(): void {
    // Clear all form state
    this.configForm.reset();
    this.configForm.patchValue({
      totalRounds: 1
    });
    
    // Clear the rounds array
    while (this.roundConfigurationsArray.length !== 0) {
      this.roundConfigurationsArray.removeAt(0);
    }
    
    // Reset other component state
    this.themeQuestionCounts = {};
    this.isConfiguring = false;
    this.sessionConfiguration = null;
    
    // Re-watch total rounds changes
    this.watchTotalRounds();
    
    // Initialize with the default round configuration
    this.updateRoundConfigurations(1);
  }

  get roundConfigurationsArray(): FormArray {
    return this.configForm.get('roundConfigurations') as FormArray;
  }

  getQuestionTypesArray(roundIndex: number): FormArray {
    const roundGroup = this.roundConfigurationsArray.at(roundIndex);
    return roundGroup.get('questionTypes') as FormArray;
  }

  getQuestionTypeControl(roundIndex: number, typeIndex: number, controlName: string): FormControl {
    const questionTypesArray = this.getQuestionTypesArray(roundIndex);
    return questionTypesArray.at(typeIndex).get(controlName) as FormControl;
  }

  private loadThemes(): void {
    this.quizManagementService.getAvailableThemes().subscribe({
      next: (response: { themes: Theme[] }) => {
        this.themes = response.themes;
      },
      error: (error: unknown) => {
        console.error('Error loading themes:', error);
        this.snackBar.open('Failed to load themes', 'Close', {
          duration: 5000
        });
      }
    });
  }

  private watchTotalRounds(): void {
    this.configForm.get('totalRounds')?.valueChanges.subscribe(totalRounds => {
      this.updateRoundConfigurations(totalRounds);
    });
  }

  private updateRoundConfigurations(totalRounds: number): void {
    const currentRounds = this.roundConfigurationsArray.length;
    
    if (totalRounds > currentRounds) {
      // Add rounds
      for (let i = currentRounds; i < totalRounds; i++) {
        this.addRound();
      }
    } else if (totalRounds < currentRounds) {
      // Remove rounds
      for (let i = currentRounds; i > totalRounds; i--) {
        this.removeRound(i - 1);
      }
    }
  }

  private addRound(): void {
    const roundGroup = this.fb.group({
      themeId: ['', Validators.required],
      questionTypes: this.fb.array(
        this.questionTypes.map(type => this.fb.group({
          type: [type],
          enabled: [false],
          questionCount: [1, [this.questionCountValidator.bind(this)]]
        }))
      )
    }, { validators: this.atLeastOneQuestionTypeEnabled });

    this.roundConfigurationsArray.push(roundGroup);
  }

  // Custom validator for question count - only validate when enabled
  private questionCountValidator(control: AbstractControl): Record<string, unknown> | null {
    if (!control.parent) {
      return null;
    }
    
    const enabled = control.parent.get('enabled')?.value;
    const count = control.value;
    
    // If disabled, always return null (valid)
    if (!enabled) {
      return null;
    }
    
    // Only validate if the question type is enabled
    if (enabled && (count < 1 || count === null || count === undefined)) {
      return { 'min': { required: 1, actual: count } };
    }
    
    return null;
  }

  // Custom validator to ensure at least one question type is enabled
  private atLeastOneQuestionTypeEnabled(group: FormGroup): Record<string, unknown> | null {
    const questionTypes = group.get('questionTypes') as FormArray;
    const hasEnabledType = questionTypes.controls.some(control => 
      control.get('enabled')?.value === true
    );
    
    return hasEnabledType ? null : { 'noQuestionTypesEnabled': true };
  }

  removeRound(index: number): void {
    this.roundConfigurationsArray.removeAt(index);
    const totalRounds = this.roundConfigurationsArray.length;
    this.configForm.patchValue({ totalRounds });
  }

  onThemeChange(roundIndex: number, themeId: string): void {
    if (themeId) {
      this.loadThemeQuestionCounts(themeId);
    }
  }

  private loadThemeQuestionCounts(themeId: string): void {
    this.quizManagementService.getThemeQuestionCounts(themeId).subscribe({
      next: (response: { questionCounts: Record<string, number> }) => {
        this.themeQuestionCounts[themeId] = response.questionCounts;
      },
      error: (error: unknown) => {
        console.error('Error loading theme question counts:', error);
        this.snackBar.open('Failed to load theme question counts', 'Close', {
          duration: 5000
        });
      }
    });
  }

  onQuestionTypeToggle(roundIndex: number, typeIndex: number): void {
    const questionTypesArray = this.getQuestionTypesArray(roundIndex);
    const questionTypeGroup = questionTypesArray.at(typeIndex);
    const questionCountControl = questionTypeGroup?.get('questionCount');
    const isEnabled = questionTypeGroup?.get('enabled')?.value;

    if (isEnabled) {
      const questionType = questionTypeGroup.get('type')?.value;
      const maxQuestions = this.getMaxQuestionsForType(roundIndex, questionType);
      questionTypeGroup?.patchValue({ questionCount: Math.min(1, maxQuestions) });
      
      // Re-enable validation for enabled question types
      questionCountControl?.setValidators([this.questionCountValidator.bind(this)]);
    } else {
      // When disabling, set count to 0 and clear validators
      questionTypeGroup?.patchValue({ questionCount: 0 });
      questionCountControl?.clearValidators();
    }

    // Trigger validation for the question type group and round group
    questionCountControl?.updateValueAndValidity();
    const roundGroup = this.roundConfigurationsArray.at(roundIndex);
    roundGroup.updateValueAndValidity();
  }

  getMaxQuestionsForType(roundIndex: number, questionType: string): number {
    const roundGroup = this.roundConfigurationsArray.at(roundIndex);
    const themeId = roundGroup.get('themeId')?.value;
    
    if (!themeId || !this.themeQuestionCounts[themeId]) {
      return 0;
    }

    return this.themeQuestionCounts[themeId][questionType] || 0;
  }

  getQuestionTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      'multiple_choice': 'Multiple Choice',
      'open_text': 'Open Text',
      'sequence': 'Sequence',
      'true_false': 'True/False',
      'numerical': 'Numerical',
      'image': 'Image',
      'audio': 'Audio',
      'video': 'Video'
    };
    return displayNames[type] || type;
  }

  configureSession(): void {
    if (this.configForm.valid) {
      this.isConfiguring = true;
      const formValue = this.configForm.value as SessionConfigFormValue;

      const config = {
        sessionCode: formValue.sessionCode || this.sessionCode,
        totalRounds: formValue.totalRounds,
        roundConfigurations: formValue.roundConfigurations.map((round: RoundFormValue, index: number) => ({
          roundNumber: index + 1,
          themeId: round.themeId,
          questionTypes: round.questionTypes
            .filter((qt: QuestionTypeFormValue) => qt.enabled)
            .map((qt: QuestionTypeFormValue) => ({
              type: qt.type,
              enabled: qt.enabled,
              questionCount: qt.questionCount
            }))
        }))
      };

      this.quizManagementService.configureSession(config).subscribe({
        next: (response: { configuration: SessionConfiguration }) => {
          this.sessionConfiguration = response.configuration;
          this.isConfiguring = false;
          this.snackBar.open('Session configured successfully!', 'Close', {
            duration: 3000
          });
          // Emit the configuration to parent component
          this.configurationComplete.emit(response.configuration);
        },
        error: (error: unknown) => {
          this.isConfiguring = false;
          console.error('Error configuring session:', error);
          const errorMessage = (error as HttpError)?.error?.error || 'Failed to configure session';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  cancelConfiguration(): void {
    this.configurationCancelled.emit();
  }
}
