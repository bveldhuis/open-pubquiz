import { Component, Input, Output, EventEmitter, OnDestroy, OnInit  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-question-timer',
    templateUrl: './question-timer.component.html',
    styleUrls: ['./question-timer.component.scss'],
    standalone: true,
    imports: [
        MatIconModule
    ]
})
export class QuestionTimerComponent implements OnInit, OnDestroy {
  @Input() timeRemaining = 0;
  @Input() totalTime = 0;
  @Input() showProgress = true;
  @Output() timeUp = new EventEmitter<void>();
  @Output() timeChanged = new EventEmitter<number>();

  private interval?: NodeJS.Timeout;

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
