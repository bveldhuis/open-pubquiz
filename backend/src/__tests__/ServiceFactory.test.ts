import { ServiceFactory } from '../services/ServiceFactory';
import { SessionService } from '../services/SessionService';
import { TeamService } from '../services/TeamService';
import { QuestionService } from '../services/QuestionService';
import { AnswerService } from '../services/AnswerService';
import { CleanupService } from '../services/CleanupService';
import { ITeamService } from '../services/interfaces/ITeamService';

// Mock all service classes
jest.mock('../services/SessionService');
jest.mock('../services/TeamService');
jest.mock('../services/QuestionService');
jest.mock('../services/AnswerService');
jest.mock('../services/CleanupService');

describe('ServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (ServiceFactory as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ServiceFactory.getInstance();
      const instance2 = ServiceFactory.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ServiceFactory);
    });

    it('should create new instance only once', () => {
      expect((ServiceFactory as any).instance).toBeUndefined();

      const instance1 = ServiceFactory.getInstance();
      expect((ServiceFactory as any).instance).toBeDefined();

      const instance2 = ServiceFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Service Creation', () => {
    let serviceFactory: ServiceFactory;

    beforeEach(() => {
      serviceFactory = ServiceFactory.getInstance();
    });

    describe('createTeamService', () => {
      it('should create and return TeamService instance', () => {
        const teamService = serviceFactory.createTeamService();

        expect(TeamService).toHaveBeenCalledTimes(1);
        expect(teamService).toBeInstanceOf(TeamService);
      });

      it('should create new instance on each call', () => {
        const teamService1 = serviceFactory.createTeamService();
        const teamService2 = serviceFactory.createTeamService();

        expect(TeamService).toHaveBeenCalledTimes(2);
        expect(teamService1).toBeInstanceOf(TeamService);
        expect(teamService2).toBeInstanceOf(TeamService);
      });
    });

    describe('createSessionService', () => {
      it('should create SessionService with team service dependency', () => {
        const mockTeamService = {} as ITeamService;
        
        const sessionService = serviceFactory.createSessionService(mockTeamService);

        expect(SessionService).toHaveBeenCalledWith(mockTeamService);
        expect(sessionService).toBeInstanceOf(SessionService);
      });
    });

    describe('createQuestionService', () => {
      it('should create QuestionService with session service dependency', () => {
        const mockSessionService = {} as any;
        
        const questionService = serviceFactory.createQuestionService(mockSessionService);

        expect(QuestionService).toHaveBeenCalledWith(mockSessionService);
        expect(questionService).toBeInstanceOf(QuestionService);
      });
    });

    describe('createAnswerService', () => {
      it('should create AnswerService with question and team service dependencies', () => {
        const mockQuestionService = {} as any;
        const mockTeamService = {} as ITeamService;
        
        const answerService = serviceFactory.createAnswerService(mockQuestionService, mockTeamService);

        expect(AnswerService).toHaveBeenCalledWith(mockQuestionService, mockTeamService);
        expect(answerService).toBeInstanceOf(AnswerService);
      });
    });

    describe('createCleanupService', () => {
      it('should create CleanupService with session service dependency and no config', () => {
        const mockSessionService = {} as any;
        
        const cleanupService = serviceFactory.createCleanupService(mockSessionService);

        expect(CleanupService).toHaveBeenCalledWith(mockSessionService, undefined);
        expect(cleanupService).toBeInstanceOf(CleanupService);
      });

      it('should create CleanupService with custom config', () => {
        const mockSessionService = {} as any;
        const customConfig = { intervalMinutes: 30, logCleanup: false };
        
        const cleanupService = serviceFactory.createCleanupService(mockSessionService, customConfig);

        expect(CleanupService).toHaveBeenCalledWith(mockSessionService, customConfig);
        expect(cleanupService).toBeInstanceOf(CleanupService);
      });
    });
  });

  describe('Service Integration', () => {
    it('should create services with proper dependency injection', () => {
      const serviceFactory = ServiceFactory.getInstance();
      
      // Create services in typical order
      const teamService = serviceFactory.createTeamService();
      const sessionService = serviceFactory.createSessionService(teamService);
      const questionService = serviceFactory.createQuestionService(sessionService);
      const answerService = serviceFactory.createAnswerService(questionService, teamService);
      const cleanupService = serviceFactory.createCleanupService(sessionService);

      expect(TeamService).toHaveBeenCalledTimes(1);
      expect(SessionService).toHaveBeenCalledWith(teamService);
      expect(QuestionService).toHaveBeenCalledWith(sessionService);
      expect(AnswerService).toHaveBeenCalledWith(questionService, teamService);
      expect(CleanupService).toHaveBeenCalledWith(sessionService, undefined);
    });
  });
});