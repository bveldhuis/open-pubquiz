import { Component, Input  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-no-content-state',
    templateUrl: './no-content-state.component.html',
    styleUrls: ['./no-content-state.component.scss'],
    standalone: true,
    imports: [
        MatIconModule
    ]
})
export class NoContentStateComponent {
  @Input() icon = 'info';
  @Input() message = 'No content available';
}