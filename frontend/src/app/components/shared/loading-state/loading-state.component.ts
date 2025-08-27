import { Component, Input  } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loading-state',
    templateUrl: './loading-state.component.html',
    styleUrls: ['./loading-state.component.scss'],
    standalone: true,
    imports: [
        MatProgressSpinnerModule
    ]
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
}