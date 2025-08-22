import { TeamService } from '../services/TeamService';
import { Team } from '../entities/Team';
import { QuizSession } from '../entities/QuizSession';
import { Answer } from '../entities/Answer';
import { Repository } from 'typeorm';

// Mock TypeORM AppDataSource
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('TeamService', () => {
  let teamService: TeamService;
  let mockTeamRepository: jest.Mocked<Repository<Team>>;
  let mockSessionRepository: jest.Mocked<Repository<QuizSession>>;
  let mockAnswerRepository: jest.Mocked<Repository<Answer>>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockTeamRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn()
    } as any;

    mockSessionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn()
    } as any;

    mockAnswerRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn()
    } as any;

    // Mock AppDataSource.getRepository to return appropriate mock
    const { AppDataSource } = require('../config/database');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity === Team) return mockTeamRepository;
      if (entity === QuizSession) return mockSessionRepository;
      if (entity === Answer) return mockAnswerRepository;
      return {};
    });

    teamService = new TeamService();
  });

  describe('createTeam', () => {
    it('should create a new team successfully', async () => {
      const sessionCode = 'ABC123';
      const teamName = 'Test Team';
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockTeam = { id: 'team-1', name: teamName, quiz_session_id: 'session-1', total_points: 0 };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockTeamRepository.findOne.mockResolvedValue(null); // No existing team
      mockTeamRepository.create.mockReturnValue(mockTeam as Team);
      mockTeamRepository.save.mockResolvedValue(mockTeam as Team);

      const result = await teamService.createTeam(sessionCode, teamName);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(mockTeamRepository.findOne).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1', name: teamName }
      });
      expect(mockTeamRepository.create).toHaveBeenCalledWith({
        quiz_session_id: 'session-1',
        name: teamName,
        total_points: 0
      });
      expect(result).toEqual(mockTeam);
    });

    it('should throw error when session not found', async () => {
      const sessionCode = 'INVALID';
      const teamName = 'Test Team';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(teamService.createTeam(sessionCode, teamName))
        .rejects.toThrow('Session not found');

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(mockTeamRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error when team name already exists', async () => {
      const sessionCode = 'ABC123';
      const teamName = 'Existing Team';
      const mockSession = { id: 'session-1', code: sessionCode };
      const existingTeam = { id: 'team-1', name: teamName, quiz_session_id: 'session-1' };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockTeamRepository.findOne.mockResolvedValue(existingTeam as Team);

      await expect(teamService.createTeam(sessionCode, teamName))
        .rejects.toThrow('Team name already exists in this session');

      expect(mockTeamRepository.create).not.toHaveBeenCalled();
      expect(mockTeamRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getTeamById', () => {
    it('should return team when found', async () => {
      const teamId = 'team-1';
      const mockTeam = { id: teamId, name: 'Test Team' };

      mockTeamRepository.findOne.mockResolvedValue(mockTeam as Team);

      const result = await teamService.getTeamById(teamId);

      expect(mockTeamRepository.findOne).toHaveBeenCalledWith({
        where: { id: teamId }
      });
      expect(result).toEqual(mockTeam);
    });

    it('should return null when team not found', async () => {
      const teamId = 'nonexistent';

      mockTeamRepository.findOne.mockResolvedValue(null);

      const result = await teamService.getTeamById(teamId);

      expect(result).toBeNull();
    });
  });

  describe('getTeamByIdOrThrow', () => {
    it('should return team when found', async () => {
      const teamId = 'team-1';
      const mockTeam = { id: teamId, name: 'Test Team' };

      mockTeamRepository.findOne.mockResolvedValue(mockTeam as Team);

      const result = await teamService.getTeamByIdOrThrow(teamId);

      expect(result).toEqual(mockTeam);
    });

    it('should throw error when team not found', async () => {
      const teamId = 'nonexistent';

      mockTeamRepository.findOne.mockResolvedValue(null);

      await expect(teamService.getTeamByIdOrThrow(teamId))
        .rejects.toThrow('Team not found');
    });
  });

  describe('updateTeamPoints', () => {
    it('should update team points successfully', async () => {
      const teamId = 'team-1';
      const points = 5;

      mockTeamRepository.update.mockResolvedValue({} as any);

      await teamService.updateTeamPoints(teamId, points);

      expect(mockTeamRepository.update).toHaveBeenCalledWith(
        teamId,
        { total_points: points }
      );
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', async () => {
      const teamId = 'team-1';
      const mockTeam = { id: teamId, name: 'Test Team' };

      mockTeamRepository.findOne.mockResolvedValue(mockTeam as Team);
      mockTeamRepository.remove.mockResolvedValue(mockTeam as Team);

      await teamService.deleteTeam(teamId);

      expect(mockTeamRepository.findOne).toHaveBeenCalledWith({
        where: { id: teamId }
      });
      expect(mockTeamRepository.remove).toHaveBeenCalledWith(mockTeam);
    });

    it('should throw error when team not found for deletion', async () => {
      const teamId = 'nonexistent';

      mockTeamRepository.findOne.mockResolvedValue(null);

      await expect(teamService.deleteTeam(teamId))
        .rejects.toThrow('Team not found');

      expect(mockTeamRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('updateTeamActivity', () => {
    it('should update team activity timestamp', async () => {
      const teamId = 'team-1';

      mockTeamRepository.update.mockResolvedValue({} as any);

      await teamService.updateTeamActivity(teamId);

      expect(mockTeamRepository.update).toHaveBeenCalledWith(
        teamId,
        expect.objectContaining({
          last_activity: expect.any(Date)
        })
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with team stats', async () => {
      const sessionCode = 'ABC123';
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn()
      };

      const mockLeaderboardData = [
        {
          team_id: 'team-1',
          team_name: 'Team A',
          total_points: 15,
          answers_submitted: 5,
          correct_answers: 3
        },
        {
          team_id: 'team-2',
          team_name: 'Team B',
          total_points: 10,
          answers_submitted: 4,
          correct_answers: 2
        }
      ];

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
             mockTeamRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockQueryBuilder.getRawMany.mockResolvedValue(mockLeaderboardData);

      const result = await teamService.getLeaderboard(sessionCode);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(result).toEqual([
        {
          id: 'team-1',
          name: 'Team A',
          total_points: 15,
          answers_submitted: 5,
          correct_answers: 3
        },
        {
          id: 'team-2',
          name: 'Team B',
          total_points: 10,
          answers_submitted: 4,
          correct_answers: 2
        }
      ]);
    });

    it('should throw error when session not found for leaderboard', async () => {
      const sessionCode = 'INVALID';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(teamService.getLeaderboard(sessionCode))
        .rejects.toThrow('Session not found');
    });
  });

  describe('getExistingTeams', () => {
    it('should return existing teams for session', async () => {
      const sessionCode = 'ABC123';
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockTeams = [
        { id: 'team-1', name: 'Team A' },
        { id: 'team-2', name: 'Team B' }
      ];

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockTeamRepository.find.mockResolvedValue(mockTeams as Team[]);

      const result = await teamService.getExistingTeams(sessionCode);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(mockTeamRepository.find).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1' },
        select: ['id', 'name']
      });
      expect(result).toEqual(mockTeams);
    });

    it('should throw error when session not found for existing teams', async () => {
      const sessionCode = 'INVALID';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(teamService.getExistingTeams(sessionCode))
        .rejects.toThrow('Session not found');
    });
  });
});