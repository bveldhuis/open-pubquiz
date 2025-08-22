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
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
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
