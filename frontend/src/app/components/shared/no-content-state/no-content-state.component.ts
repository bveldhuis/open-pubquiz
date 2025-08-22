import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-content-state',
  template: `
    <div class="no-content-state">
      <mat-icon>{{ icon }}</mat-icon>
      <p>{{ message }}</p>
    </div>
  `,
  styles: []
})
export class NoContentStateComponent {
  @Input() icon: string = 'info';
  @Input() message: string = 'No content available';
}