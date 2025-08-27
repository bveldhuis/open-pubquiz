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

      mockTeamRepository.delete.mockResolvedValue({} as any);

      await teamService.deleteTeam(teamId);

      expect(mockTeamRepository.delete).toHaveBeenCalledWith(teamId);
    });

    it('should delete team even if not found (no validation)', async () => {
      const teamId = 'nonexistent';

      await expect(teamService.deleteTeam(teamId)).resolves.not.toThrow();

      expect(mockTeamRepository.delete).toHaveBeenCalledWith(teamId);
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
      const mockTeams = [
        { id: 'team-1', name: 'Team A', total_points: 15, answers: [] } as unknown as Team,
        { id: 'team-2', name: 'Team B', total_points: 10, answers: [] } as unknown as Team
      ];
      const mockAnswers = [
        { team_id: 'team-1', is_correct: true } as Answer,
        { team_id: 'team-1', is_correct: true } as Answer,
        { team_id: 'team-1', is_correct: false } as Answer,
        { team_id: 'team-2', is_correct: true } as Answer,
        { team_id: 'team-2', is_correct: false } as Answer
      ];

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockTeamRepository.find.mockResolvedValue(mockTeams);
      mockAnswerRepository.find
        .mockResolvedValueOnce(mockAnswers.filter(a => a.team_id === 'team-1'))
        .mockResolvedValueOnce(mockAnswers.filter(a => a.team_id === 'team-2'));

      const result = await teamService.getLeaderboard(sessionCode);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(mockTeamRepository.find).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1' },
        relations: ['answers'],
        order: { total_points: 'DESC' }
      });
      expect(result).toEqual([
        {
          id: 'team-1',
          name: 'Team A',
          total_points: 15,
          answers_submitted: 3,
          correct_answers: 2
        },
        {
          id: 'team-2',
          name: 'Team B',
          total_points: 10,
          answers_submitted: 2,
          correct_answers: 1
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
      const mockSession = { 
        id: 'session-1', 
        code: sessionCode,
        teams: [
          { id: 'team-1', name: 'Team A', total_points: 10 },
          { id: 'team-2', name: 'Team B', total_points: 5 }
        ]
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as unknown as QuizSession);
      mockAnswerRepository.find
        .mockResolvedValueOnce([]) // No answers for team-1
        .mockResolvedValueOnce([]); // No answers for team-2

      const result = await teamService.getExistingTeams(sessionCode);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode },
        relations: ['teams']
      });
      expect(result).toEqual([
        { id: 'team-1', name: 'Team A', total_points: 10, answers_submitted: 0, correct_answers: 0 },
        { id: 'team-2', name: 'Team B', total_points: 5, answers_submitted: 0, correct_answers: 0 }
      ]);
    });

    it('should throw error when session not found for existing teams', async () => {
      const sessionCode = 'INVALID';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(teamService.getExistingTeams(sessionCode))
        .rejects.toThrow('Session not found');
    });
  });
});