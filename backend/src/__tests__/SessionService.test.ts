import { SessionService } from '../services/SessionService';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { SessionEvent, EventType } from '../entities/SessionEvent';
import { ITeamService } from '../services/interfaces/ITeamService';
import { Repository } from 'typeorm';
import { LessThan } from 'typeorm';

// Mock TypeORM AppDataSource
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

// Mock team service
const mockTeamService: jest.Mocked<ITeamService> = {
  createTeam: jest.fn(),
  getTeamById: jest.fn(),
  getTeamByIdOrThrow: jest.fn(),
  updateTeamPoints: jest.fn(),
  deleteTeam: jest.fn(),
  updateTeamActivity: jest.fn(),
  getLeaderboard: jest.fn(),
  getExistingTeams: jest.fn(),
};

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSessionRepository: jest.Mocked<Repository<QuizSession>>;
  let mockEventRepository: jest.Mocked<Repository<SessionEvent>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repositories
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

    mockEventRepository = {
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

    // Mock AppDataSource.getRepository
    const { AppDataSource } = require('../config/database');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity === QuizSession) return mockSessionRepository;
      if (entity === SessionEvent) return mockEventRepository;
      return {};
    });

    sessionService = new SessionService(mockTeamService);
  });

  describe('createSession', () => {
    beforeEach(() => {
      // Mock Math.random to generate predictable session codes
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a new session with unique code', async () => {
      const sessionName = 'Test Quiz';
      const mockSession = {
        id: 'session-1',
        name: sessionName,
        code: 'PPPPP0',
        status: QuizSessionStatus.WAITING,
        current_round: 1
      };

      mockSessionRepository.findOne.mockResolvedValue(null); // No existing session with code
      mockSessionRepository.create.mockReturnValue(mockSession as QuizSession);
      mockSessionRepository.save.mockResolvedValue(mockSession as QuizSession);

      const result = await sessionService.createSession(sessionName);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'PPPPP0' }
      });
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        name: sessionName,
        code: 'PPPPP0',
        status: QuizSessionStatus.WAITING,
        current_round: 1
      });
      expect(result).toEqual(mockSession);
    });

    it('should generate new code if first one exists', async () => {
      const sessionName = 'Test Quiz';
      const existingSession = { id: 'existing', code: 'PPPPP0' };
      const newSession = {
        id: 'session-1',
        name: sessionName,
        code: 'PPPPP1', // Different code after regeneration
        status: QuizSessionStatus.WAITING,
        current_round: 1
      };

      // First call returns existing session, second returns null
      mockSessionRepository.findOne
        .mockResolvedValueOnce(existingSession as QuizSession)
        .mockResolvedValueOnce(null);
      
      // Mock Math.random to return different values for code generation
      (Math.random as jest.Mock)
        .mockReturnValueOnce(0.5) // First code: PPPPP0
        .mockReturnValueOnce(0.6); // Second code: PPPPP1

      mockSessionRepository.create.mockReturnValue(newSession as QuizSession);
      mockSessionRepository.save.mockResolvedValue(newSession as QuizSession);

      const result = await sessionService.createSession(sessionName);

      expect(mockSessionRepository.findOne).toHaveBeenCalledTimes(2);
      expect(result.code).toBe('PPPPP1');
    });
  });

  describe('getSession', () => {
    it('should return session when found', async () => {
      const sessionCode = 'ABC123';
      const mockSession = { id: 'session-1', code: sessionCode };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);

      const result = await sessionService.getSession(sessionCode);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode },
        relations: []
      });
      expect(result).toEqual(mockSession);
    });

    it('should return session with relations when specified', async () => {
      const sessionCode = 'ABC123';
      const relations = ['teams', 'questions'];
      const mockSession = { id: 'session-1', code: sessionCode };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);

      await sessionService.getSession(sessionCode, relations);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode },
        relations: relations
      });
    });

    it('should return null when session not found', async () => {
      const sessionCode = 'INVALID';

      mockSessionRepository.findOne.mockResolvedValue(null);

      const result = await sessionService.getSession(sessionCode);

      expect(result).toBeNull();
    });
  });

  describe('getSessionByCodeOrThrow', () => {
    it('should return session when found', async () => {
      const sessionCode = 'ABC123';
      const mockSession = { id: 'session-1', code: sessionCode };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);

      const result = await sessionService.getSessionByCodeOrThrow(sessionCode);

      expect(result).toEqual(mockSession);
    });

    it('should throw error when session not found', async () => {
      const sessionCode = 'INVALID';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(sessionService.getSessionByCodeOrThrow(sessionCode))
        .rejects.toThrow('Session not found');
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      const sessionCode = 'ABC123';
      const status = QuizSessionStatus.ACTIVE;

      mockSessionRepository.update.mockResolvedValue({} as any);

      await sessionService.updateSessionStatus(sessionCode, status);

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { code: sessionCode },
        { status: status }
      );
    });
  });

  describe('updateCurrentQuestionId', () => {
    it('should update current question ID', async () => {
      const sessionCode = 'ABC123';
      const questionId = 'question-1';

      mockSessionRepository.update.mockResolvedValue({} as any);

      await sessionService.updateCurrentQuestionId(sessionCode, questionId);

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { code: sessionCode },
        { current_question_id: questionId }
      );
    });

    it('should clear current question ID when null', async () => {
      const sessionCode = 'ABC123';

      mockSessionRepository.update.mockResolvedValue({} as any);

      await sessionService.updateCurrentQuestionId(sessionCode, null);

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { code: sessionCode },
        { current_question_id: null }
      );
    });
  });

  describe('endSession', () => {
    it('should end session and update status', async () => {
      const sessionCode = 'ABC123';

      mockSessionRepository.update.mockResolvedValue({} as any);

      await sessionService.endSession(sessionCode);

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { code: sessionCode },
        { 
          status: QuizSessionStatus.FINISHED,
          current_question_id: null,
          end_time: expect.any(Date)
        }
      );
    });
  });

  describe('startNextRound', () => {
    it('should increment round number and return new round', async () => {
      const sessionCode = 'ABC123';
      const currentRound = 2;

      mockSessionRepository.update.mockResolvedValue({} as any);

      const result = await sessionService.startNextRound(sessionCode);

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { code: sessionCode },
        expect.objectContaining({
          current_round: expect.any(Number)
        })
      );
      expect(typeof result).toBe('number');
    });
  });

  describe('logEvent', () => {
    it('should log session event', async () => {
      const sessionId = 'session-1';
      const eventType = EventType.QUESTION_STARTED;
      const eventData = { questionId: 'question-1' };
      const mockEvent = {
        id: 'event-1',
        quiz_session_id: sessionId,
        event_type: eventType,
        event_data: eventData
      };

      mockEventRepository.create.mockReturnValue(mockEvent as SessionEvent);
      mockEventRepository.save.mockResolvedValue(mockEvent as SessionEvent);

      await sessionService.logEvent(sessionId, eventType, eventData);

      expect(mockEventRepository.create).toHaveBeenCalledWith({
        quiz_session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        created_at: expect.any(Date)
      });
      expect(mockEventRepository.save).toHaveBeenCalledWith(mockEvent);
    });

    it('should log event without data', async () => {
      const sessionId = 'session-1';
      const eventType = EventType.SESSION_ENDED;

      mockEventRepository.create.mockReturnValue({} as SessionEvent);
      mockEventRepository.save.mockResolvedValue({} as SessionEvent);

      await sessionService.logEvent(sessionId, eventType);

      expect(mockEventRepository.create).toHaveBeenCalledWith({
        quiz_session_id: sessionId,
        event_type: eventType,
        event_data: null,
        created_at: expect.any(Date)
      });
    });
  });

  describe('getSessionEvents', () => {
    it('should return events with default pagination', async () => {
      const sessionCode = 'ABC123';
      const mockSession = { id: 'session-1', code: sessionCode };
             const mockEvents = [
         { id: 'event-1', event_type: EventType.SESSION_CREATED },
         { id: 'event-2', event_type: EventType.QUESTION_STARTED }
      ];

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockEventRepository.find.mockResolvedValue(mockEvents as SessionEvent[]);

      const result = await sessionService.getSessionEvents(sessionCode);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(mockEventRepository.find).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1' },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0
      });
      expect(result.events).toEqual(mockEvents);
      expect(result.total).toBe(2);
    });

    it('should filter events by type when specified', async () => {
      const sessionCode = 'ABC123';
      const eventType = EventType.QUESTION_STARTED;
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockEvents = [{ id: 'event-1', event_type: eventType }];

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockEventRepository.find.mockResolvedValue(mockEvents as SessionEvent[]);

      await sessionService.getSessionEvents(sessionCode, { eventType });

      expect(mockEventRepository.find).toHaveBeenCalledWith({
        where: { 
          quiz_session_id: 'session-1',
          event_type: eventType
        },
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0
      });
    });

    it('should use custom pagination options', async () => {
      const sessionCode = 'ABC123';
      const options = { limit: 10, offset: 20 };
      const mockSession = { id: 'session-1', code: sessionCode };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockEventRepository.find.mockResolvedValue([]);

      await sessionService.getSessionEvents(sessionCode, options);

      expect(mockEventRepository.find).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1' },
        order: { created_at: 'DESC' },
        take: 10,
        skip: 20
      });
    });

    it('should throw error when session not found for events', async () => {
      const sessionCode = 'INVALID';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(sessionService.getSessionEvents(sessionCode))
        .rejects.toThrow('Session not found');
    });
  });

  describe('joinSession', () => {
    it('should create new team when joining session', async () => {
      const sessionCode = 'ABC123';
      const teamName = 'New Team';
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockTeam = { id: 'team-1', name: teamName };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockTeamService.getExistingTeams.mockResolvedValue([]);
      mockTeamService.createTeam.mockResolvedValue(mockTeam as any);

      const result = await sessionService.joinSession(sessionCode, teamName);

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { code: sessionCode }
      });
      expect(mockTeamService.getExistingTeams).toHaveBeenCalledWith(sessionCode);
      expect(mockTeamService.createTeam).toHaveBeenCalledWith(sessionCode, teamName);
      expect(result).toEqual({
        team: mockTeam,
        session: mockSession,
        isNewTeam: true
      });
    });

    it('should return existing team when team name already exists', async () => {
      const sessionCode = 'ABC123';
      const teamName = 'Existing Team';
      const mockSession = { id: 'session-1', code: sessionCode };
      const existingTeam = { id: 'team-1', name: teamName };

      mockSessionRepository.findOne.mockResolvedValue(mockSession as QuizSession);
      mockTeamService.getExistingTeams.mockResolvedValue([existingTeam]);

      const result = await sessionService.joinSession(sessionCode, teamName);

      expect(mockTeamService.createTeam).not.toHaveBeenCalled();
      expect(result).toEqual({
        team: existingTeam,
        session: mockSession,
        isNewTeam: false
      });
    });

    it('should throw error when session not found for join', async () => {
      const sessionCode = 'INVALID';
      const teamName = 'Test Team';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(sessionService.joinSession(sessionCode, teamName))
        .rejects.toThrow('Session not found');

      expect(mockTeamService.getExistingTeams).not.toHaveBeenCalled();
      expect(mockTeamService.createTeam).not.toHaveBeenCalled();
    });
  });

  describe('cleanupInactiveSessions', () => {
    it('should cleanup inactive sessions', async () => {
      const inactiveHours = 4;
      const mockInactiveSessions = [
        { id: 'session-1', code: 'ABC123', status: QuizSessionStatus.ACTIVE },
        { id: 'session-2', code: 'DEF456', status: QuizSessionStatus.WAITING }
      ];

      mockSessionRepository.find.mockResolvedValue(mockInactiveSessions as QuizSession[]);
      mockSessionRepository.update.mockResolvedValue({} as any);

      const result = await sessionService.cleanupInactiveSessions(inactiveHours);

      expect(mockSessionRepository.find).toHaveBeenCalledWith({
        where: {
          status: expect.any(Object), // Not FINISHED
          last_activity: LessThan(expect.any(Date))
        }
      });
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { id: expect.any(String) },
        { 
          status: QuizSessionStatus.FINISHED,
          end_time: expect.any(Date)
        }
      );
      expect(result.ended).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should return zero when no inactive sessions found', async () => {
      mockSessionRepository.find.mockResolvedValue([]);

      const result = await sessionService.cleanupInactiveSessions();

      expect(result.ended).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getCleanupStats', () => {
    it('should return session statistics', async () => {
      const mockStats = [
        { status: QuizSessionStatus.ACTIVE, count: 5 },
        { status: QuizSessionStatus.WAITING, count: 3 },
        { status: QuizSessionStatus.FINISHED, count: 10 }
      ];

             const mockQueryBuilder = {
         select: jest.fn().mockReturnThis(),
         groupBy: jest.fn().mockReturnThis(),
         getRawMany: jest.fn().mockResolvedValue(mockStats)
       };

       mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await sessionService.getCleanupStats();

      expect(result).toEqual({
        totalSessions: 18,
        activeSessions: 5,
        finishedSessions: 10,
        inactiveSessions: 3
      });
    });

    it('should handle empty statistics', async () => {
             const mockQueryBuilder = {
         select: jest.fn().mockReturnThis(),
         groupBy: jest.fn().mockReturnThis(),
         getRawMany: jest.fn().mockResolvedValue([])
       };

       mockSessionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await sessionService.getCleanupStats();

      expect(result).toEqual({
        totalSessions: 0,
        activeSessions: 0,
        finishedSessions: 0,
        inactiveSessions: 0
      });
    });
  });
});