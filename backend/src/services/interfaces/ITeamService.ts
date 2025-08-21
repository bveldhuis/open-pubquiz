import { Team } from '../../entities/Team';
import { TeamWithStats } from './ISessionService';

export interface ITeamService {
  createTeam(sessionCode: string, teamName: string): Promise<Team>;
  getTeamById(teamId: string): Promise<Team | null>;
  getTeamByIdOrThrow(teamId: string): Promise<Team>;
  updateTeamPoints(teamId: string, points: number): Promise<void>;
  deleteTeam(teamId: string): Promise<void>;
  updateTeamActivity(teamId: string): Promise<void>;
  getLeaderboard(sessionCode: string): Promise<TeamWithStats[]>;
  getExistingTeams(sessionCode: string): Promise<{ id: string; name: string }[]>;
}
