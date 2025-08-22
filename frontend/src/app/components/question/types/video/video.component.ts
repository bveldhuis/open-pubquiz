import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
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
