import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule
    ]
})
export class HomeComponent {
  private router = inject(Router);

  goToPresenter(): void {
    this.router.navigate(['/presenter']);
  }

  goToJoin(): void {
    this.router.navigate(['/join']);
  }
}
