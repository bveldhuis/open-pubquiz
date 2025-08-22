import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Question } from '../../../../models/question.model';

@Component({
    selector: 'app-audio',
    templateUrl: './audio.component.html',
    styleUrls: ['./audio.component.scss'],
    standalone: false
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
