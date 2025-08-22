import { Component, Input  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-no-content-state',
    template: `
    <div class="no-content-state">
      <mat-icon>{{ icon }}</mat-icon>
      <p>{{ message }}</p>
    </div>
  `,
    styles: [],
    standalone: true,
    imports: [
        MatIconModule
    ]
})
export class NoContentStateComponent {
  @Input() icon = 'info';
  @Input() message = 'No content available';
}