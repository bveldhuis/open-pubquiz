import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-presenter-controls',
    templateUrl: './presenter-controls.component.html',
    styleUrls: ['./presenter-controls.component.scss'],
    standalone: false
})
export class PresenterControlsComponent {
  @Input() isActive = false;
  @Input() canStart = true;
  @Input() hasAnswers = false;
  @Input() submissionsReceived = 0;
  @Input() totalTeams = 0;
  
  @Output() endQuestion = new EventEmitter<void>();

  getSubmissionPercentage(): number {
    if (this.totalTeams === 0) return 0;
    return (this.submissionsReceived / this.totalTeams) * 100;
  }

  getStatusClass(): string {
    if (this.isActive) return 'waiting';
    if (this.hasAnswers) return 'completed';
    return 'ready';
  }

  getStatusIcon(): string {
    if (this.isActive) return 'schedule';
    if (this.hasAnswers) return 'check_circle';
    return 'radio_button_unchecked';
  }

  getStatusText(): string {
    if (this.isActive) return 'Question in progress';
    if (this.hasAnswers) return 'Answers received';
    return 'Ready to start';
  }
}
