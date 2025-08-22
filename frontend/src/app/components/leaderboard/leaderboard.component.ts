import { Component, Input } from '@angular/core';
import { LeaderboardTeam } from '../../models/leaderboard-team.model';
import { StatisticsUtils } from '../../utils';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss'],
    standalone: false
})
export class LeaderboardComponent {
  @Input() teams: LeaderboardTeam[] = [];
  @Input() currentRound?: number;

  get sortedTeams(): LeaderboardTeam[] {
    return [...this.teams].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  }

  get averageScore(): number {
    const scores = this.teams.map(team => team.total_points || 0);
    return StatisticsUtils.calculateAverageScore(scores);
  }

  get highestScore(): number {
    const scores = this.teams.map(team => team.total_points || 0);
    return StatisticsUtils.findHighestScore(scores);
  }
}
