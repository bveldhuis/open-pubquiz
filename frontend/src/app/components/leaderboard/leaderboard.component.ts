import { Component, Input } from '@angular/core';

export interface Team {
  id: string;
  name: string;
  total_points: number;
  answers_submitted: number;
  correct_answers: number;
}

@Component({
  selector: 'app-leaderboard',
  template: `
    <div class="leaderboard">
      <div class="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        <div class="round-info" *ngIf="currentRound">
          <span class="round-label">Round {{ currentRound }}</span>
        </div>
      </div>

      <div class="teams-list">
        <div 
          class="team-item" 
          *ngFor="let team of sortedTeams; let i = index"
          [class.top-three]="i < 3">
          
          <div class="position">
            <div class="position-number" [class.top-three]="i < 3">
              {{ i + 1 }}
            </div>
            <div class="medal" *ngIf="i < 3">
              <mat-icon *ngIf="i === 0">emoji_events</mat-icon>
              <mat-icon *ngIf="i === 1">military_tech</mat-icon>
              <mat-icon *ngIf="i === 2">workspace_premium</mat-icon>
            </div>
          </div>

          <div class="team-info">
            <div class="team-name">{{ team.name }}</div>
            <div class="team-stats">
              <span class="stat">
                <mat-icon>star</mat-icon>
                {{ team.total_points || 0 }} pts
              </span>
              <span class="stat">
                <mat-icon>quiz</mat-icon>
                {{ team.correct_answers || 0 }}/{{ team.answers_submitted || 0 }} correct
              </span>
            </div>
          </div>

          <div class="points-display">
            <span class="points">{{ team.total_points || 0 }}</span>
            <span class="points-label">points</span>
          </div>
        </div>
      </div>

      <div class="no-teams" *ngIf="teams.length === 0">
        <mat-icon>group_off</mat-icon>
        <p>No teams have joined yet</p>
      </div>

      <div class="leaderboard-footer">
        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-label">Total Teams:</span>
            <span class="stat-value">{{ teams.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Average Score:</span>
            <span class="stat-value">{{ averageScore | number:'1.1-1' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Highest Score:</span>
            <span class="stat-value">{{ highestScore }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .leaderboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }

    .leaderboard-header h2 {
      margin: 0;
      color: #333;
      font-size: 2rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .round-info {
      background: #e3f2fd;
      padding: 8px 16px;
      border-radius: 20px;
    }

    .round-label {
      color: #1976d2;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .teams-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 30px;
    }

    .team-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .team-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .team-item.top-three {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-color: #ff9800;
    }

    .position {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      min-width: 60px;
    }

    .position-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e0e0e0;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .position-number.top-three {
      background: #ff9800;
      color: white;
    }

    .medal {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .medal mat-icon {
      font-size: 1.5rem;
      color: #ff9800;
    }

    .team-info {
      flex: 1;
    }

    .team-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .team-stats {
      display: flex;
      gap: 20px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 0.9rem;
    }

    .stat mat-icon {
      font-size: 1rem;
      color: #ff9800;
    }

    .points-display {
      text-align: center;
      min-width: 80px;
    }

    .points {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #4caf50;
      line-height: 1;
    }

    .points-label {
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .no-teams {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-teams mat-icon {
      font-size: 4rem;
      color: #e0e0e0;
      margin-bottom: 15px;
    }

    .no-teams p {
      margin: 0;
      font-size: 1.1rem;
    }

    .leaderboard-footer {
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .stats-summary {
      display: flex;
      justify-content: space-around;
      gap: 20px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
    }

    @media (max-width: 768px) {
      .leaderboard {
        padding: 20px;
      }

      .leaderboard-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .team-item {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }

      .team-stats {
        justify-content: center;
      }

      .stats-summary {
        flex-direction: column;
        gap: 15px;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stat-label {
        display: inline;
        margin-bottom: 0;
      }

      .stat-value {
        display: inline;
      }
    }
  `]
})
export class LeaderboardComponent {
  @Input() teams: Team[] = [];
  @Input() currentRound?: number;

  get sortedTeams(): Team[] {
    return [...this.teams].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  }

  get averageScore(): number {
    if (this.teams.length === 0) return 0;
    const total = this.teams.reduce((sum, team) => sum + (team.total_points || 0), 0);
    return total / this.teams.length;
  }

  get highestScore(): number {
    if (this.teams.length === 0) return 0;
    const scores = this.teams.map(team => team.total_points || 0);
    return Math.max(...scores);
  }
}
