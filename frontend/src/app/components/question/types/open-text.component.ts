import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Question } from '../../../models/question.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-open-text',
  template: `
    <div class="open-text-container">
      <div class="text-answer">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Your Answer</mat-label>
          <textarea 
            matInput 
            [formControl]="answerControl"
            placeholder="Type your answer here..."
            rows="4"
            [maxlength]="maxLength"
            (input)="onInputChange()">
          </textarea>
          <mat-hint *ngIf="showCharacterCount">
            {{ answerControl.value?.length || 0 }} / {{ maxLength }} characters
          </mat-hint>
          <mat-error *ngIf="answerControl.hasError('required')">
            Answer is required
          </mat-error>
          <mat-error *ngIf="answerControl.hasError('minlength')">
            Answer must be at least {{ minLength }} characters
          </mat-error>
        </mat-form-field>
      </div>

      <div class="answer-preview" *ngIf="showPreview && answerControl.value">
        <h4>Your Answer:</h4>
        <div class="preview-content">
          {{ answerControl.value }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .open-text-container {
      margin: 20px 0;
    }

    .text-answer {
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
    }

    .answer-preview {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }

    .answer-preview h4 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .preview-content {
      background: white;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #2196f3;
      font-size: 1rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    textarea {
      font-size: 1rem;
      line-height: 1.5;
      resize: vertical;
      min-height: 120px;
    }

    textarea:disabled {
      background-color: #fafafa;
      color: #666;
    }

    .mat-form-field {
      font-size: 1rem;
    }

    .mat-hint {
      font-size: 0.8rem;
      color: #666;
    }

    @media (max-width: 768px) {
      textarea {
        font-size: 0.95rem;
        min-height: 100px;
      }

      .preview-content {
        font-size: 0.95rem;
      }
    }
  `]
})
export class OpenTextComponent implements OnInit, OnDestroy {
  @Input() question?: Question;
  @Input() isInteractive = false;
  @Input() isAnswerSubmitted = false;
  @Input() showPreview = false;
  @Input() showCharacterCount = true;
  @Input() maxLength = 500;
  @Input() minLength = 1;
  
  @Output() answerChanged = new EventEmitter<string>();
  @Output() answerValid = new EventEmitter<boolean>();

  answerControl = new FormControl('', [
    Validators.required,
    Validators.minLength(this.minLength),
    Validators.maxLength(this.maxLength)
  ]);

  private inputSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.updateDisabledState();

    // Debounce input changes to avoid too many emissions
    this.inputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      // takeUntil(this.destroy$)
    ).subscribe(value => {
      this.answerChanged.emit(value);
      this.answerValid.emit(this.answerControl.valid);
    });

    // Listen to form control changes
    this.answerControl.valueChanges.subscribe(value => {
      this.inputSubject.next(value || '');
    });
  }

  ngOnChanges() {
    this.updateDisabledState();
  }

  private updateDisabledState() {
    if (!this.isInteractive || this.isAnswerSubmitted) {
      this.answerControl.disable();
    } else {
      this.answerControl.enable();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.inputSubject.complete();
  }

  onInputChange() {
    // This method is called on every input event
    // The actual debounced emission is handled in ngOnInit
  }

  setValue(value: string) {
    this.answerControl.setValue(value, { emitEvent: false });
  }

  getValue(): string {
    return this.answerControl.value || '';
  }

  isValid(): boolean {
    return this.answerControl.valid;
  }

  reset() {
    this.answerControl.reset();
  }
}
