import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-audio',
  template: `
    <div class="audio-question">
      <div class="audio-container" *ngIf="isPresenter">
        <audio 
          #audioElement
          [src]="question?.media_url || ''"
          [controls]="isPresenter"
          [autoplay]="isPresenter && isActive"
          [loop]="isPresenter && isActive"
          class="question-audio"
          (error)="onAudioError($event)"
          (ended)="onAudioEnded()">
          Your browser does not support the audio element.
        </audio>
      </div>
      
      <!-- Show message for participants that audio is controlled by presenter -->
      <div class="presenter-control-message" *ngIf="!isPresenter && question?.media_url">
        <mat-icon>volume_up</mat-icon>
        <span>Audio will be played by the presenter</span>
      </div>
      <div class="question-content">
        <p class="question-text">{{ question?.question_text }}</p>
        <div class="answer-input">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Answer</mat-label>
            <input 
              matInput 
              [(ngModel)]="currentAnswer" 
              placeholder="Enter your answer"
              [disabled]="isDisabled"
              (input)="onInputChange()">
          </mat-form-field>
        </div>
        <div class="question-info">
          <span class="points">Points: {{ question?.points || 0 }}</span>
          <span class="time-limit" *ngIf="question?.time_limit">Time: {{ question?.time_limit }}s</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audio-question {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .audio-container {
      text-align: center;
    }

    .question-audio {
      width: 100%;
      max-width: 500px;
    }

    .presenter-control-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      color: #1976d2;
      font-size: 0.9rem;
      margin-top: 10px;
    }

    .presenter-control-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .question-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .question-text {
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
      margin: 0;
    }

    .answer-input {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .question-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      color: #666;
    }

    .points {
      font-weight: 500;
      color: #3f51b5;
    }

    .time-limit {
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
    }
  `]
})
export class AudioComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Input() isPresenter: boolean = false;
  @Input() isActive: boolean = false;
  @Output() answerChange = new EventEmitter<string>();
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  currentAnswer: string = '';

  ngOnInit(): void {
    // Auto-play and loop for presenter when question becomes active
    // Note: ViewChild might not be available in ngOnInit, so we'll handle this in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Auto-play and loop for presenter when question becomes active
    if (this.isPresenter && this.isActive && this.audioElement?.nativeElement) {
      this.audioElement.nativeElement.play().catch(error => {
        console.error('Failed to auto-play audio:', error);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to isActive prop
    if (changes['isActive'] && this.audioElement?.nativeElement) {
      if (this.isPresenter && this.isActive) {
        // Start playing when question becomes active
        this.audioElement.nativeElement.play().catch(error => {
          console.error('Failed to auto-play audio:', error);
        });
      } else {
        // Stop playing when question becomes inactive
        this.audioElement.nativeElement.pause();
        this.audioElement.nativeElement.currentTime = 0;
      }
    }
  }

  ngOnDestroy(): void {
    // Stop audio when component is destroyed
    if (this.audioElement?.nativeElement) {
      this.audioElement.nativeElement.pause();
      this.audioElement.nativeElement.currentTime = 0;
    }
  }

  onAudioError(event: any): void {
    console.error('Audio failed to load:', event);
  }

  onAudioEnded(): void {
    // Auto-restart for presenter if question is still active
    if (this.isPresenter && this.isActive && this.audioElement?.nativeElement) {
      this.audioElement.nativeElement.play().catch(error => {
        console.error('Failed to restart audio:', error);
      });
    }
  }

  onAnswerChange(): void {
    this.answerChange.emit(this.currentAnswer);
  }

  onInputChange(): void {
    this.onAnswerChange();
  }
}
