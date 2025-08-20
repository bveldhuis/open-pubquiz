import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-participant',
  template: `
    <div class="container">
      <div class="participant-content">
        <div class="team-info">
          <h1>Welcome, {{ teamName }}!</h1>
          <p class="session-info">Session: {{ sessionCode }}</p>
        </div>

        <div class="status-card">
          <h2>Waiting for questions...</h2>
          <p>Your presenter will start the quiz soon.</p>
        </div>

        <div class="connection-status">
          <mat-icon [class]="isConnected ? 'connected' : 'disconnected'">
            {{ isConnected ? 'wifi' : 'wifi_off' }}
          </mat-icon>
          <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .team-info {
      text-align: center;
      margin-bottom: 40px;
    }

    .team-info h1 {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 10px;
    }

    .session-info {
      font-size: 1.2rem;
      color: #666;
    }

    .status-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .status-card h2 {
      color: #333;
      margin-bottom: 15px;
    }

    .status-card p {
      color: #666;
      font-size: 1.1rem;
    }

    .connection-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 1rem;
    }

    .connection-status mat-icon.connected {
      color: #4caf50;
    }

    .connection-status mat-icon.disconnected {
      color: #f44336;
    }

    @media (max-width: 768px) {
      .participant-content {
        padding: 10px;
      }

      .team-info h1 {
        font-size: 2rem;
      }

      .status-card {
        padding: 20px;
      }
    }
  `]
})
export class ParticipantComponent implements OnInit, OnDestroy {
  teamName: string = '';
  sessionCode: string = '';
  isConnected: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/join']);
      return;
    }

    this.teamName = currentUser.teamName;
    this.sessionCode = currentUser.sessionCode;

    // Connect to Socket.IO
    this.socketService.connect();
    this.isConnected = this.socketService.isConnected();

    // Join session via Socket.IO
    this.socketService.joinSession({
      sessionCode: this.sessionCode,
      teamName: this.teamName
    });

    // Subscribe to Socket.IO events
    this.subscriptions.push(
      this.socketService.teamJoined$.subscribe(event => {
        this.snackBar.open(`Successfully joined session!`, 'Close', {
          duration: 3000
        });
      }),

      this.socketService.error$.subscribe(error => {
        this.snackBar.open(error.message, 'Close', {
          duration: 5000
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.disconnect();
  }
}
