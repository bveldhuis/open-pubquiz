import { setupSocketHandlers } from '../socket/socketHandlers';
import { ServiceFactory } from '../services/ServiceFactory';

// Mock ServiceFactory and services
jest.mock('../services/ServiceFactory');

const mockSessionService = {
  getSessionByCodeOrThrow: jest.fn(),
  logEvent: jest.fn(),
  updateCurrentQuestionId: jest.fn(),
  updateSessionStatus: jest.fn(),
  startNextRound: jest.fn(),
  joinSession: jest.fn(),
};

const mockTeamService = {
  getExistingTeams: jest.fn(),
  getTeamByIdOrThrow: jest.fn(),
  updateTeamActivity: jest.fn(),
  getLeaderboard: jest.fn(),
};

const mockQuestionService = {
  getQuestionByIdOrThrow: jest.fn(),
  startQuestion: jest.fn(),
  endQuestion: jest.fn(),
};

const mockAnswerService = {
  submitAnswer: jest.fn(),
};

const mockServiceFactory = {
  getInstance: jest.fn().mockReturnValue({
    createSessionService: jest.fn().mockReturnValue(mockSessionService),
    createTeamService: jest.fn().mockReturnValue(mockTeamService),
    createQuestionService: jest.fn().mockReturnValue(mockQuestionService),
    createAnswerService: jest.fn().mockReturnValue(mockAnswerService),
  }),
};

(ServiceFactory as any).getInstance = mockServiceFactory.getInstance;

describe('Socket Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Setup', () => {
    it('should setup socket handlers without errors', () => {
      const mockSocket = {
        on: jest.fn(),
        join: jest.fn(),
        emit: jest.fn(),
        data: {}
      };
      
      const mockIO = {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'connection') {
            handler(mockSocket);
          }
        })
      };

      setupSocketHandlers(mockIO as any);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_room', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_session', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('submit_answer', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('presenter_action', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should create all required services', () => {
      const mockIO = { on: jest.fn() };
      
      setupSocketHandlers(mockIO as any);
      
      expect(mockServiceFactory.getInstance).toHaveBeenCalled();
      expect(mockServiceFactory.getInstance().createSessionService).toHaveBeenCalled();
      expect(mockServiceFactory.getInstance().createTeamService).toHaveBeenCalled();
      expect(mockServiceFactory.getInstance().createQuestionService).toHaveBeenCalled();
      expect(mockServiceFactory.getInstance().createAnswerService).toHaveBeenCalled();
    });

    it('should handle connection event registration', () => {
      const connectionHandler = jest.fn();
      const mockIO = {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'connection') {
            connectionHandler.mockImplementation(handler);
          }
        })
      };

      setupSocketHandlers(mockIO as any);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('Service Dependencies', () => {
    it('should initialize services in correct order', () => {
      const mockIO = { on: jest.fn() };
      
      setupSocketHandlers(mockIO as any);
      
      const factory = mockServiceFactory.getInstance();
      
      // Verify services are created with proper dependencies
      expect(factory.createTeamService).toHaveBeenCalled();
      expect(factory.createSessionService).toHaveBeenCalledWith(mockTeamService);
      expect(factory.createQuestionService).toHaveBeenCalledWith(mockSessionService);
      expect(factory.createAnswerService).toHaveBeenCalledWith(mockQuestionService, mockTeamService);
    });
  });
});