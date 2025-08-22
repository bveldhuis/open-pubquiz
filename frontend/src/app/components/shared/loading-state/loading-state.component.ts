import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="loading-state">
      <mat-spinner diameter="40"></mat-spinner>
      <p>{{ message }}</p>
    </div>
  `,
  styles: []
})
export class LoadingStateComponent {
  @Input() message: string = 'Loading...';
}