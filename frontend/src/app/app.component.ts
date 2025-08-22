import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <span class="toolbar-title" (click)="goHome()">🎯 Open Pub Quiz</span>
      <span class="toolbar-spacer"></span>
      <button mat-button routerLink="/presenter" class="toolbar-button">
        <mat-icon>present_to_all</mat-icon>
        Presenter
      </button>
      <button mat-button routerLink="/join" class="toolbar-button">
        <mat-icon>group_add</mat-icon>
        Join Quiz
      </button>
    </mat-toolbar>

    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toolbar-title {
      font-size: 1.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .toolbar-title:hover {
      opacity: 0.8;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .toolbar-button {
      margin-left: 8px;
    }

    .toolbar-button mat-icon {
      margin-right: 4px;
      width: 20px !important;
      height: 20px !important;
      min-width: 20px !important;
      min-height: 20px !important;
    }

    .app-container {
      margin-top: 64px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    @media (max-width: 768px) {
      .toolbar-title {
        font-size: 1.2rem;
      }
      
      .toolbar-button span {
        display: none;
      }
      
      .app-container {
        margin-top: 56px;
        min-height: calc(100vh - 56px);
      }
    }
  `]
})
export class AppComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
