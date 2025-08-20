import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Question } from '../../services/quiz-management.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-participant-question',
  template: `
    <div class="participant-question" *ngIf="question">
      <div class="question-header">
        <div class="question-info">
          <h2>Question {{ question.question_number }}</h2>
          <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
          <span class="points">{{ question.points }} point{{ question.points !== 1 ? 's' : '' }}</span>
        </div>
        
        <div class="timer-section" *ngIf="isActive">
          <div class="timer" [class.warning]="timeRemaining <= 10">
            <mat-icon>timer</mat-icon>
            <span>{{ formatTime(timeRemaining) }}</span>
          </div>
        </div>
      </div>

      <div class="question-content">
        <div class="question-text">
          <h3>{{ question.question_text }}</h3>
        </div>

        <div class="fun-fact" *ngIf="question.fun_fact">
          <mat-icon>lightbulb</mat-icon>
          <p>{{ question.fun_fact }}</p>
        </div>

        <!-- Multiple Choice Options -->
        <div class="options" *ngIf="question.type === 'multiple_choice' && question.options">
          <div 
            class="option" 
            *ngFor="let option of question.options; let i = index"
            [class.selected]="selectedAnswer === option"
            (click)="selectAnswer(option)">
            <span class="option-letter">{{ getOptionLetter(i) }}</span>
            <span class="option-text">{{ option }}</span>
            <mat-icon *ngIf="selectedAnswer === option" class="selected-icon">check_circle</mat-icon>
          </div>
        </div>

        <!-- Open Text Answer -->
        <div class="text-answer" *ngIf="question.type === 'open_text'">
          <form [formGroup]="answerForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Answer</mat-label>
              <textarea 
                matInput 
                formControlName="textAnswer" 
                placeholder="Type your answer here..."
                rows="3">
              </textarea>
            </mat-form-field>
          </form>
        </div>

        <!-- Sequence Items -->
        <div class="sequence-container" *ngIf="question.type === 'sequence' && question.sequence_items">
          <div class="sequence-instructions">
            <p>Drag and drop the items to arrange them in the correct order:</p>
          </div>
          
          <div class="sequence-items">
            <div 
              class="sequence-item" 
              *ngFor="let item of shuffledSequenceItems; let i = index"
              [draggable]="isActive && !isAnswerSubmitted"
              (dragstart)="onDragStart($event, i)"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event, i)"
              (dragenter)="onDragEnter($event, i)"
              [class.dragging]="draggedIndex === i"
              [class.drag-over]="dragOverIndex === i">
              <span class="sequence-number">{{ i + 1 }}</span>
              <span class="sequence-text">{{ item }}</span>
              <mat-icon class="drag-handle">drag_indicator</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="answer-controls" *ngIf="isActive && !isAnswerSubmitted">
        <button 
          mat-raised-button 
          color="primary" 
          (click)="submitAnswer()"
          [disabled]="!canSubmit">
          <mat-icon>send</mat-icon>
          Submit Answer
        </button>
      </div>

      <div class="answer-status" *ngIf="isAnswerSubmitted">
        <div class="submitted-message">
          <mat-icon>check_circle</mat-icon>
          <span>Answer submitted successfully!</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-question {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 800px;
      margin: 0 auto;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
    }

    .question-info h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 1.8rem;
    }

    .question-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      margin-right: 10px;
    }

    .points {
      background: #4caf50;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .timer-section {
      text-align: center;
    }

    .timer {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f5f5f5;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .timer.warning {
      background: #ffebee;
      color: #d32f2f;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .question-content {
      margin-bottom: 30px;
    }

    .question-text h3 {
      font-size: 1.4rem;
      color: #333;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .fun-fact {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff3e0;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #ff9800;
    }

    .fun-fact mat-icon {
      color: #ff9800;
      margin-top: 2px;
    }

    .fun-fact p {
      margin: 0;
      color: #e65100;
      font-style: italic;
      font-size: 0.95rem;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 20px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
      cursor: pointer;
    }

    .option:hover {
      border-color: #e3f2fd;
      background: #f3f8ff;
    }

    .option.selected {
      border-color: #4caf50;
      background: #e8f5e8;
    }

    .option-letter {
      background: #3f51b5;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .option.selected .option-letter {
      background: #4caf50;
    }

    .option-text {
      flex: 1;
      font-size: 1rem;
    }

    .selected-icon {
      color: #4caf50;
    }

    .text-answer {
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
    }

    .sequence-container {
      margin-top: 20px;
    }

    .sequence-instructions {
      margin-bottom: 15px;
      color: #666;
      font-style: italic;
    }

    .sequence-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sequence-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
      cursor: move;
    }

    .sequence-item.dragging {
      opacity: 0.5;
      transform: rotate(5deg);
    }

    .sequence-item.drag-over {
      border-color: #4caf50;
      background: #e8f5e8;
    }

    .sequence-number {
      background: #ff9800;
      color: white;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .sequence-text {
      flex: 1;
      font-size: 0.95rem;
    }

    .drag-handle {
      color: #999;
      cursor: move;
    }

    .answer-controls {
      display: flex;
      justify-content: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .answer-controls button {
      padding: 12px 30px;
      font-size: 1.1rem;
    }

    .answer-controls mat-icon {
      margin-right: 8px;
    }

    .answer-status {
      display: flex;
      justify-content: center;
      padding-top: 20px;
    }

    .submitted-message {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #e8f5e8;
      color: #2e7d32;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: 600;
    }

    .submitted-message mat-icon {
      color: #4caf50;
    }

    @media (max-width: 768px) {
      .participant-question {
        padding: 20px;
      }

      .question-header {
        flex-direction: column;
        gap: 15px;
      }

      .question-info h2 {
        font-size: 1.5rem;
      }

      .question-text h3 {
        font-size: 1.2rem;
      }

      .answer-controls button {
        width: 100%;
      }
    }
  `]
})
export class ParticipantQuestionComponent implements OnInit, OnDestroy {
  @Input() set question(value: Question | undefined) {
    this._question = value;
    this.resetForm();
    if (value?.type === 'sequence' && value.sequence_items) {
      this.shuffledSequenceItems = [...value.sequence_items].sort(() => Math.random() - 0.5);
    }
  }
  get question(): Question | undefined {
    return this._question;
  }
  private _question?: Question;
  @Input() set isActive(value: boolean) {
    this._isActive = value;
    this.updateFormState();
  }
  get isActive(): boolean {
    return this._isActive;
  }
  private _isActive = false;
  
  @Input() timeRemaining = 0;

  @Output() answerSubmitted = new EventEmitter<string | string[]>();

  answerForm: FormGroup;
  selectedAnswer?: string;
  shuffledSequenceItems: string[] = [];
  set isAnswerSubmitted(value: boolean) {
    this._isAnswerSubmitted = value;
    this.updateFormState();
  }
  get isAnswerSubmitted(): boolean {
    return this._isAnswerSubmitted;
  }
  private _isAnswerSubmitted = false;
  canSubmit = false;
  
  public draggedIndex = -1;
  public dragOverIndex = -1;
  private timerSubscription?: Subscription;
  private formSubscription?: Subscription;

  constructor(private fb: FormBuilder) {
    this.answerForm = this.fb.group({
      textAnswer: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Update form control state based on component state
    this.updateFormState();
    
    // Subscribe to form value changes to update canSubmit
    this.formSubscription = this.answerForm.valueChanges.subscribe(() => {
      this.updateCanSubmit();
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  getQuestionTypeLabel(type: string): string {
    const labels = {
      'multiple_choice': 'Multiple Choice',
      'open_text': 'Open Text',
      'sequence': 'Sequence'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  selectAnswer(answer: string) {
    if (!this._isActive || this._isAnswerSubmitted) return;
    this.selectedAnswer = answer;
    this.updateCanSubmit();
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragEnter(event: DragEvent, index: number) {
    this.dragOverIndex = index;
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    
    if (this.draggedIndex !== -1 && this.draggedIndex !== index) {
      const items = [...this.shuffledSequenceItems];
      const draggedItem = items[this.draggedIndex];
      items.splice(this.draggedIndex, 1);
      items.splice(index, 0, draggedItem);
      this.shuffledSequenceItems = items;
    }
    
    this.draggedIndex = -1;
    this.dragOverIndex = -1;
    this.updateCanSubmit();
  }

  private resetForm() {
    this.answerForm.reset();
    this.selectedAnswer = undefined;
    this._isAnswerSubmitted = false;
    this.shuffledSequenceItems = [];
    this.updateFormState();
  }

  private updateFormState() {
    const textAnswerControl = this.answerForm.get('textAnswer');
    if (textAnswerControl) {
      if (this._isActive && !this._isAnswerSubmitted) {
        textAnswerControl.enable();
      } else {
        textAnswerControl.disable();
      }
    }
    this.updateCanSubmit();
  }

  private updateCanSubmit() {
    if (!this._isActive || this._isAnswerSubmitted) {
      this.canSubmit = false;
      return;
    }

    switch (this._question?.type) {
      case 'multiple_choice':
        this.canSubmit = !!this.selectedAnswer;
        break;
      case 'open_text':
        const textAnswer = this.answerForm.get('textAnswer')?.value;
        this.canSubmit = !!textAnswer && textAnswer.trim().length > 0;
        break;
      case 'sequence':
        this.canSubmit = this.shuffledSequenceItems.length > 0;
        break;
      default:
        this.canSubmit = false;
    }
  }

  submitAnswer() {
    if (!this._isActive || this._isAnswerSubmitted) return;

    let answer: string | string[];
    
    switch (this._question?.type) {
      case 'multiple_choice':
        if (!this.selectedAnswer) return;
        answer = this.selectedAnswer;
        break;
      
      case 'open_text':
        if (!this.answerForm.valid) return;
        answer = this.answerForm.get('textAnswer')?.value;
        break;
      
      case 'sequence':
        if (this.shuffledSequenceItems.length === 0) return;
        answer = this.shuffledSequenceItems;
        break;
      
      default:
        return;
    }

    this._isAnswerSubmitted = true;
    this.updateFormState();
    this.answerSubmitted.emit(answer);
  }
}
