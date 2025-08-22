import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, AbstractControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuizManagementService, Theme, SessionConfiguration } from '../../services/quiz-management.service';

@Component({
  selector: 'app-session-config',
  template: `
    <div class="session-config-container">
      <div class="config-header">
        <h2>Configure Quiz Session</h2>
        <p>Set up your quiz with themes and question types for each round</p>
      </div>

      <form [formGroup]="configForm" (ngSubmit)="configureSession()" class="config-form">
        <!-- Session Code -->
        <div class="form-section">
          <h3>Session Information</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Session Code</mat-label>
            <input matInput formControlName="sessionCode" placeholder="Enter session code (e.g., ABC123)">
            <mat-error *ngIf="configForm.get('sessionCode')?.hasError('required')">
              Session code is required
            </mat-error>
            <mat-error *ngIf="configForm.get('sessionCode')?.hasError('pattern')">
              Session code must be 6 characters (letters and numbers)
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Total Rounds -->
        <div class="form-section">
          <h3>Number of Rounds</h3>
          <mat-form-field appearance="outline">
            <mat-label>Total Rounds</mat-label>
            <input matInput type="number" formControlName="totalRounds" min="1" max="10">
            <mat-error *ngIf="configForm.get('totalRounds')?.hasError('required')">
              Number of rounds is required
            </mat-error>
            <mat-error *ngIf="configForm.get('totalRounds')?.hasError('min')">
              Must have at least 1 round
            </mat-error>
            <mat-error *ngIf="configForm.get('totalRounds')?.hasError('max')">
              Maximum 10 rounds allowed
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Round Configurations -->
        <div class="form-section" *ngIf="configForm.get('totalRounds')?.value > 0">
          <h3>Round Configurations</h3>
          <div formArrayName="roundConfigurations" class="rounds-container">
            <div 
              *ngFor="let roundGroup of roundConfigurationsArray.controls; let i = index" 
              [formGroupName]="i"
              class="round-config">
              
              <div class="round-header">
                <h4>Round {{ i + 1 }}</h4>
                <button 
                  type="button" 
                  mat-icon-button 
                  color="warn" 
                  (click)="removeRound(i)"
                  *ngIf="roundConfigurationsArray.length > 1">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

                             <!-- Theme Selection -->
               <mat-form-field appearance="outline" class="full-width">
                 <mat-label>Theme</mat-label>
                 <mat-select formControlName="themeId" (selectionChange)="onThemeChange(i, $event.value)">
                   <mat-option *ngFor="let theme of themes" [value]="theme.id">
                     {{ theme.name }}
                   </mat-option>
                 </mat-select>
                 <mat-error *ngIf="roundGroup.get('themeId')?.hasError('required')">
                   Theme is required
                 </mat-error>
               </mat-form-field>

               <!-- Round Validation Error -->
               <div class="round-error" *ngIf="roundGroup.hasError('noQuestionTypesEnabled')">
                 <mat-error>At least one question type must be enabled for this round</mat-error>
               </div>

              <!-- Question Types Configuration -->
              <div class="question-types-section" *ngIf="roundGroup.get('themeId')?.value">
                <h5>Question Types</h5>
                <div class="question-types-grid">
                  <div 
                    *ngFor="let questionTypeGroup of getQuestionTypesArray(i).controls; let j = index"
                    class="question-type-config">
                    
                    <mat-checkbox 
                      [formControl]="getQuestionTypeControl(i, j, 'enabled')"
                      (change)="onQuestionTypeToggle(i, j)">
                      {{ getQuestionTypeDisplayName(getQuestionTypeControl(i, j, 'type').value) }}
                    </mat-checkbox>
                    
                    <mat-form-field 
                      appearance="outline" 
                      class="question-count-field"
                      *ngIf="getQuestionTypeControl(i, j, 'enabled').value">
                      <mat-label># Questions</mat-label>
                      <input 
                        matInput 
                        type="number" 
                        [formControl]="getQuestionTypeControl(i, j, 'questionCount')"
                        min="1"
                        [max]="getMaxQuestionsForType(i, getQuestionTypeControl(i, j, 'type').value)">
                      <mat-hint>
                        Max: {{ getMaxQuestionsForType(i, getQuestionTypeControl(i, j, 'type').value) }}
                      </mat-hint>
                      <mat-error *ngIf="getQuestionTypeControl(i, j, 'questionCount').hasError('required')">
                        Question count is required
                      </mat-error>
                      <mat-error *ngIf="getQuestionTypeControl(i, j, 'questionCount').hasError('min')">
                        Must have at least 1 question
                      </mat-error>
                      <mat-error *ngIf="getQuestionTypeControl(i, j, 'questionCount').hasError('max')">
                        Cannot exceed available questions
                      </mat-error>
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

                 <!-- Submit Button -->
         <div class="form-actions">
           <button 
             mat-stroked-button 
             type="button"
             (click)="cancelConfiguration()"
             [disabled]="isConfiguring">
             Cancel
           </button>
           <button 
             mat-raised-button 
             color="primary" 
             type="submit"
             [disabled]="configForm.invalid || isConfiguring">
             <mat-spinner *ngIf="isConfiguring" diameter="20" class="spinner"></mat-spinner>
             <span *ngIf="!isConfiguring">Configure Session</span>
           </button>
           
         </div>
      </form>

      <!-- Configuration Summary -->
      <div class="config-summary" *ngIf="sessionConfiguration">
        <h3>Configuration Summary</h3>
        <div class="summary-content">
          <div class="summary-item">
            <strong>Total Rounds:</strong> {{ sessionConfiguration.total_rounds }}
          </div>
          <div class="summary-item" *ngFor="let round of sessionConfiguration.round_configurations">
            <strong>Round {{ round.roundNumber }}:</strong> {{ round.themeName }}
            <div class="round-details">
              <span *ngFor="let qt of round.questionTypes" class="question-type-summary">
                {{ qt.enabled ? qt.questionCount + ' ' + getQuestionTypeDisplayName(qt.type) : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-config-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .config-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .config-header h2 {
      color: #333;
      margin-bottom: 10px;
    }

    .config-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .config-form {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .form-section {
      margin-bottom: 30px;
    }

    .form-section h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.3rem;
    }

    .full-width {
      width: 100%;
    }

    .rounds-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .round-config {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
    }

    .round-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .round-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }

    .question-types-section {
      margin-top: 20px;
    }

    .question-types-section h5 {
      color: #555;
      margin-bottom: 15px;
    }

    .question-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .question-type-config {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

         .question-count-field {
       width: 100px;
     }

     .round-error {
       margin-top: 10px;
       padding: 10px;
       background: #ffebee;
       border-radius: 4px;
       border-left: 4px solid #f44336;
     }

     .form-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 30px;
      margin-bottom: 80px;
    }

    .form-actions button {
      padding: 12px 30px;
      font-size: 1.1rem;
    }

    .spinner {
      margin-right: 8px;
    }

    .config-summary {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .config-summary h3 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .summary-item {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .round-details {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .question-type-summary {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .session-config-container {
        padding: 10px;
      }

      .config-form {
        padding: 20px;
      }

      .question-types-grid {
        grid-template-columns: 1fr;
      }

      .question-type-config {
        flex-direction: column;
        align-items: flex-start;
      }

      .question-count-field {
        width: 100%;
      }
    }
  `]
})
export class SessionConfigComponent implements OnInit, OnChanges {
  @Input() sessionCode: string = '';
  @Output() configurationComplete = new EventEmitter<SessionConfiguration>();
  @Output() configurationCancelled = new EventEmitter<void>();
  
  configForm: FormGroup;
  themes: Theme[] = [];
  questionTypes = ['multiple_choice', 'open_text', 'sequence', 'true_false', 'numerical', 'image', 'audio', 'video'];
  themeQuestionCounts: Record<string, Record<string, number>> = {};
  isConfiguring = false;
  sessionConfiguration: SessionConfiguration | null = null;

  constructor(
    private fb: FormBuilder,
    private quizManagementService: QuizManagementService,
    private snackBar: MatSnackBar
  ) {
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
      next: (response) => {
        this.themes = response.themes;
      },
      error: (error) => {
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
  private questionCountValidator(control: AbstractControl): {[key: string]: any} | null {
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
  private atLeastOneQuestionTypeEnabled(group: FormGroup): {[key: string]: any} | null {
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
      this.loadThemeQuestionCounts(themeId, roundIndex);
    }
  }

  private loadThemeQuestionCounts(themeId: string, roundIndex: number): void {
    this.quizManagementService.getThemeQuestionCounts(themeId).subscribe({
      next: (response) => {
        this.themeQuestionCounts[themeId] = response.questionCounts;
      },
      error: (error) => {
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
      const formValue = this.configForm.value;

      const config = {
        sessionCode: formValue.sessionCode,
        totalRounds: formValue.totalRounds,
        roundConfigurations: formValue.roundConfigurations.map((round: any, index: number) => ({
          roundNumber: index + 1,
          themeId: round.themeId,
          questionTypes: round.questionTypes
            .filter((qt: any) => qt.enabled)
            .map((qt: any) => ({
              type: qt.type,
              enabled: qt.enabled,
              questionCount: qt.questionCount
            }))
        }))
      };

      this.quizManagementService.configureSession(config).subscribe({
        next: (response) => {
          this.sessionConfiguration = response.configuration;
          this.isConfiguring = false;
          this.snackBar.open('Session configured successfully!', 'Close', {
            duration: 3000
          });
          // Emit the configuration to parent component
          this.configurationComplete.emit(response.configuration);
        },
        error: (error) => {
          this.isConfiguring = false;
          console.error('Error configuring session:', error);
          this.snackBar.open(error.error?.error || 'Failed to configure session', 'Close', {
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
