import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  template: `
    <div class="container">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">🎯 Open Pub Quiz</h1>
          <p class="hero-subtitle">
            A self-hosted pub quiz application with real-time updates, 
            multiple question types, and professional UI
          </p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <mat-icon class="feature-icon">real_time</mat-icon>
              <h3>Real-time Updates</h3>
              <p>Live question updates, timers, and leaderboards via Socket.IO</p>
            </div>
            
            <div class="feature-card">
              <mat-icon class="feature-icon">quiz</mat-icon>
              <h3>Multiple Question Types</h3>
              <p>Multiple choice, open text, and drag-and-drop sequence questions</p>
            </div>
            
            <div class="feature-card">
              <mat-icon class="feature-icon">qr_code</mat-icon>
              <h3>QR Code Join</h3>
              <p>Participants can join sessions by scanning QR codes</p>
            </div>
            
            <div class="feature-card">
              <mat-icon class="feature-icon">devices</mat-icon>
              <h3>Responsive Design</h3>
              <p>Professional UI that works on desktop, tablet, and mobile</p>
            </div>
          </div>
          
          <div class="action-buttons">
            <button mat-raised-button color="primary" class="action-button" (click)="goToPresenter()">
              <mat-icon>present_to_all</mat-icon>
              Start as Presenter
            </button>
            
            <button mat-raised-button color="accent" class="action-button" (click)="goToJoin()">
              <mat-icon>group_add</mat-icon>
              Join as Participant
            </button>
          </div>
        </div>
      </div>
      
      <div class="info-section">
        <h2>How it works</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Create Session</h3>
            <p>Presenter creates a new quiz session and gets a unique code</p>
          </div>
          
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Join Session</h3>
            <p>Participants scan QR code or enter session code to join</p>
          </div>
          
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>Answer Questions</h3>
            <p>Real-time questions with timers and multiple formats</p>
          </div>
          
          <div class="step-card">
            <div class="step-number">4</div>
            <h3>View Results</h3>
            <p>Live leaderboard and review phases after each question</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 80px 0;
      text-align: center;
      margin-bottom: 60px;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .hero-subtitle {
      font-size: 1.3rem;
      margin-bottom: 40px;
      opacity: 0.9;
      line-height: 1.6;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin: 40px 0;
    }

    .feature-card {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 30px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      transition: transform 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
    }

    .feature-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 20px;
      opacity: 0.9;
    }

    .feature-card h3 {
      font-size: 1.3rem;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .feature-card p {
      opacity: 0.8;
      line-height: 1.5;
    }

    .action-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 40px;
    }

    .action-button {
      padding: 16px 32px;
      font-size: 1.1rem;
      border-radius: 8px;
      min-width: 200px;
    }

    .action-button mat-icon {
      margin-right: 8px;
    }

    .info-section {
      padding: 60px 0;
      background: white;
    }

    .info-section h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 50px;
      color: #333;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .step-card {
      text-align: center;
      padding: 30px;
      border-radius: 12px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .step-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .step-number {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0 auto 20px;
    }

    .step-card h3 {
      font-size: 1.3rem;
      margin-bottom: 15px;
      color: #333;
    }

    .step-card p {
      color: #666;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }

      .hero-subtitle {
        font-size: 1.1rem;
      }

      .feature-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .action-button {
        width: 100%;
        max-width: 300px;
      }

      .steps-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }
  `]
})
export class HomeComponent {
  constructor(private router: Router) {}

  goToPresenter(): void {
    this.router.navigate(['/presenter']);
  }

  goToJoin(): void {
    this.router.navigate(['/join']);
  }
}
