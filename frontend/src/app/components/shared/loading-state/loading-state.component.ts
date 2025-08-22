import { Component, Input  } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loading-state',
    template: `
    <div class="loading-state">
      <mat-spinner diameter="40"></mat-spinner>
      <p>{{ message }}</p>
    </div>
  `,
    styles: [],
    standalone: true,
    imports: [
        MatProgressSpinnerModule
    ]
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
}