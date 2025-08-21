import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-question-timer',
  template: `
    <div class="timer" [class]="getTimerClasses()">
      <mat-icon>timer</mat-icon>
      <span class="timer-text">{{ formatTime(timeRemaining) }}</span>
      <div class="timer-progress" *ngIf="showProgress">
        <div class="progress-bar" [style.width.%]="getProgressPercentage()"></div>
      </div>
    </div>
  `,
  styles: [`
    .timer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #f5f5f5;
      font-weight: 600;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }

    .timer.warning {
      background: #fff3cd;
      color: #856404;
      animation: pulse 1s infinite;
    }

    .timer.critical {
      background: #f8d7da;
      color: #721c24;
      animation: pulse 0.5s infinite;
    }

    .timer-text {
      font-family: 'Courier New', monospace;
      font-size: 1.4rem;
    }

    .timer-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: currentColor;
      transition: width 1s linear;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class QuestionTimerComponent implements OnInit, OnDestroy {
  @Input() timeRemaining = 0;
  @Input() totalTime = 0;
  @Input() showProgress = true;
  @Output() timeUp = new EventEmitter<void>();
  @Output() timeChanged = new EventEmitter<number>();

  private interval?: any;

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.timeChanged.emit(this.timeRemaining);
        
        if (this.timeRemaining === 0) {
          this.timeUp.emit();
          this.stopTimer();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimerClasses(): string {
    if (this.timeRemaining <= 5) {
      return 'timer critical';
    } else if (this.timeRemaining <= 10) {
      return 'timer warning';
    }
    return 'timer';
  }

  getProgressPercentage(): number {
    if (this.totalTime === 0) return 100;
    return (this.timeRemaining / this.totalTime) * 100;
  }
}
