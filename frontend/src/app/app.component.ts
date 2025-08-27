import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [
        RouterOutlet,
        RouterModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule
    ]
})
export class AppComponent {
  private router = inject(Router);

  goHome() {
    this.router.navigate(['/']);
  }
}
