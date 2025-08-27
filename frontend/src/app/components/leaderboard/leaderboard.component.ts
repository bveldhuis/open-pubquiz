import { Component, Input  } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { NoContentStateComponent } from '../shared/no-content-state/no-content-state.component';
import { LeaderboardTeam } from '../../models/leaderboard-team.model';
import { StatisticsUtils } from '../../utils';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss'],
    standalone: true,
    imports: [
        DecimalPipe,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        NoContentStateComponent
    ]
})
export class LeaderboardComponent {
  @Input() teams: LeaderboardTeam[] = [];
  @Input() currentRound?: number;
  @Input() totalQuestions?: number;

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
