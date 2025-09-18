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
    // Clear any existing timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Clear all timers after each test
    jest.clearAllTimers();
  });

  describe('Setup', () => {
    it('should setup socket handlers without errors', () => {
      const mockSocket = {
        on: jest.fn(),
        join: jest.fn(),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        data: {},
        id: 'test-socket-id',
        connected: true
      };
      
      const mockIO = {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'connection') {
            // Call the handler immediately to simulate connection
            handler(mockSocket);
          }
        }),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        in: jest.fn().mockReturnThis(),
        fetchSockets: jest.fn().mockResolvedValue([])
      };

      // Mock the engine property for connection_error handler
      (mockIO as any).engine = {
        on: jest.fn()
      };

      setupSocketHandlers(mockIO as any);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('ping', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_room', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_session', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('submit_answer', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('timer_update', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('presenter_action', expect.any(Function));
    });

    it('should create all required services', () => {
      const mockIO = { 
        on: jest.fn(),
        engine: { on: jest.fn() }
      };
      
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
        }),
        engine: { on: jest.fn() }
      };

      setupSocketHandlers(mockIO as any);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('Service Dependencies', () => {
    it('should initialize services in correct order', () => {
      const mockIO = { 
        on: jest.fn(),
        engine: { on: jest.fn() }
      };
      
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