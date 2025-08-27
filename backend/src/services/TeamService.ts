import { AppDataSource } from '../config/database';
import { Team } from '../entities/Team';
import { Answer } from '../entities/Answer';
import { QuizSession } from '../entities/QuizSession';
import { ITeamService } from './interfaces/ITeamService';
import { TeamWithStats } from './interfaces/ISessionService';

export class TeamService implements ITeamService {
  private teamRepository;
  private answerRepository;

  constructor() {
    this.teamRepository = AppDataSource.getRepository(Team);
    this.answerRepository = AppDataSource.getRepository(Answer);
  }

  /**
   * Create a new team
   */
  async createTeam(sessionCode: string, teamName: string): Promise<Team> {
    // Get session directly from database to avoid circular dependency
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({
      where: { code: sessionCode }
    });

    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if team name already exists
    const existingTeam = await this.teamRepository.findOne({
      where: { quiz_session_id: session.id, name: teamName }
    });

    if (existingTeam) {
      throw new Error('Team name already exists in this session');
    }

    const team = this.teamRepository.create({
      quiz_session_id: session.id,
      name: teamName,
      total_points: 0
    });

    return await this.teamRepository.save(team);
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    return await this.teamRepository.findOne({ where: { id: teamId } });
  }

  /**
   * Get team by ID or throw error
   */
  async getTeamByIdOrThrow(teamId: string): Promise<Team> {
    const team = await this.getTeamById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    return team;
  }

  /**
   * Update team points
   */
  async updateTeamPoints(teamId: string, points: number): Promise<void> {
    await this.teamRepository.update(teamId, { total_points: points });
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<void> {
    await this.teamRepository.delete(teamId);
  }

  /**
   * Update team activity
   */
  async updateTeamActivity(teamId: string): Promise<void> {
    await this.teamRepository.update(teamId, { last_activity: new Date() });
  }

  /**
   * Get leaderboard for a session
   */
  async getLeaderboard(sessionCode: string): Promise<TeamWithStats[]> {
    // Get session directly from database to avoid circular dependency
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({
      where: { code: sessionCode }
    });

    if (!session) {
      throw new Error('Session not found');
    }
    
    // Get teams with their answers
    const teams = await this.teamRepository.find({
      where: { quiz_session_id: session.id },
      relations: ['answers'],
      order: { total_points: 'DESC' }
    });

    // Calculate statistics for each team
    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      const answers = await this.answerRepository.find({
        where: { team_id: team.id }
      });

      const answers_submitted = answers.length;
      const correct_answers = answers.filter(answer => answer.is_correct === true).length;
      
      // Recalculate total points from actual answers to ensure accuracy
      const calculated_total_points = answers.reduce((sum, answer) => sum + (answer.points_awarded || 0), 0);

      return {
        id: team.id,
        name: team.name,
        total_points: calculated_total_points, // Use calculated points instead of stored points
        answers_submitted,
        correct_answers
      };
    }));

    // Sort by calculated total points
    return teamsWithStats.sort((a, b) => b.total_points - a.total_points);
  }

  /**
   * Get existing teams for a session
   */
  async getExistingTeams(sessionCode: string): Promise<{ id: string; name: string; total_points: number; answers_submitted: number; correct_answers: number }[]> {
    // Get session directly from database to avoid circular dependency
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({
      where: { code: sessionCode },
      relations: ['teams']
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get teams with their answers to calculate statistics
    const teamsWithStats = await Promise.all(session.teams.map(async (team: any) => {
      const answers = await this.answerRepository.find({
        where: { team_id: team.id }
      });

      const answers_submitted = answers.length;
      const correct_answers = answers.filter(answer => answer.is_correct === true).length;
      
      // Recalculate total points from actual answers to ensure accuracy
      const calculated_total_points = answers.reduce((sum, answer) => sum + (answer.points_awarded || 0), 0);

      return {
        id: team.id,
        name: team.name,
        total_points: calculated_total_points, // Use calculated points instead of stored points
        answers_submitted,
        correct_answers
      };
    }));

    return teamsWithStats;
  }
}
