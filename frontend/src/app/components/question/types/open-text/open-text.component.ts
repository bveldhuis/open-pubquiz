import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges  } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Question } from '../../../../models/question.model';

import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-open-text',
    templateUrl: './open-text.component.html',
    styleUrls: ['./open-text.component.scss'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule
    ]
})
export class OpenTextComponent implements OnInit, OnDestroy, OnChanges {
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
