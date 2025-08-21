import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-video',
  template: `
    <div class="video-question">
      <div class="video-container" *ngIf="isPresenter">
        <video 
          #videoElement
          [src]="question?.media_url || ''"
          [controls]="isPresenter"
          [autoplay]="isPresenter && isActive"
          [loop]="isPresenter && isActive"
          [muted]="isPresenter && isActive"
          class="question-video"
          (error)="onVideoError($event)"
          (ended)="onVideoEnded()">
          Your browser does not support the video element.
        </video>
      </div>
      
      <!-- Show message for participants that video is controlled by presenter -->
      <div class="presenter-control-message" *ngIf="!isPresenter && question?.media_url">
        <mat-icon>play_circle</mat-icon>
        <span>Video will be played by the presenter</span>
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
    .video-question {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .video-container {
      text-align: center;
    }

    .question-video {
      width: 100%;
      max-width: 600px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
export class VideoComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() question?: Question;
  @Input() isDisabled: boolean = false;
  @Input() isPresenter: boolean = false;
  @Input() isActive: boolean = false;
  @Output() answerChange = new EventEmitter<string>();
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  currentAnswer: string = '';

  ngOnInit(): void {
    // Auto-play and loop for presenter when question becomes active
    // Note: ViewChild might not be available in ngOnInit, so we'll handle this in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Auto-play and loop for presenter when question becomes active
    if (this.isPresenter && this.isActive && this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.play().catch(error => {
        console.error('Failed to auto-play video:', error);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to isActive prop
    if (changes['isActive'] && this.videoElement?.nativeElement) {
      if (this.isPresenter && this.isActive) {
        // Start playing when question becomes active
        this.videoElement.nativeElement.play().catch(error => {
          console.error('Failed to auto-play video:', error);
        });
      } else {
        // Stop playing when question becomes inactive
        this.videoElement.nativeElement.pause();
        this.videoElement.nativeElement.currentTime = 0;
      }
    }
  }

  ngOnDestroy(): void {
    // Stop video when component is destroyed
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
      this.videoElement.nativeElement.currentTime = 0;
    }
  }

  onVideoError(event: any): void {
    console.error('Video failed to load:', event);
  }

  onVideoEnded(): void {
    // Auto-restart for presenter if question is still active
    if (this.isPresenter && this.isActive && this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.play().catch(error => {
        console.error('Failed to restart video:', error);
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
