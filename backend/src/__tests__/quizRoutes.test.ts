import request from 'supertest';
import express from 'express';
import { ServiceFactory } from '../services/ServiceFactory';
import { QuizSessionStatus } from '../entities/QuizSession';

// Mock the entire ServiceFactory module
jest.mock('../services/ServiceFactory');

// Create mocks for services
const mockSessionService = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  getSessionByCodeOrThrow: jest.fn(),
  updateSessionStatus: jest.fn(),
  endSession: jest.fn(),
  startNextRound: jest.fn(),
  getSessionEvents: jest.fn(),
  getCleanupStats: jest.fn(),
};

const mockTeamService = {
  getLeaderboard: jest.fn(),
  getExistingTeams: jest.fn(),
};

const mockQuestionService = {
  getQuestionsForSession: jest.fn(),
  bulkCreateQuestions: jest.fn(),
  createQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  startQuestion: jest.fn(),
  endQuestion: jest.fn(),
};

const mockCleanupService = {
  getStatus: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

// Mock ServiceFactory
const mockServiceFactory = {
  getInstance: jest.fn().mockReturnValue({
    createSessionService: jest.fn().mockReturnValue(mockSessionService),
    createTeamService: jest.fn().mockReturnValue(mockTeamService),
    createQuestionService: jest.fn().mockReturnValue(mockQuestionService),
    createCleanupService: jest.fn().mockReturnValue(mockCleanupService),
  }),
};

(ServiceFactory as any).getInstance = mockServiceFactory.getInstance;

describe('Quiz Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app and load routes
    app = express();
    app.use(express.json());
    
    // Import routes after mocks are set up
    const quizRoutes = require('../routes/quizRoutes');
    app.use('/api/quiz', quizRoutes.default || quizRoutes);
  });

  describe('POST /quiz/create', () => {
    it('should create new quiz session successfully', async () => {
      const requestData = {
        name: 'Test Quiz Session'
      };

      const mockSession = {
        id: 'session-1',
        name: 'Test Quiz Session',
        code: 'ABC123',
        status: QuizSessionStatus.WAITING,
        current_round: 1,
        created_at: new Date('2024-01-01T10:00:00Z')
      };

      mockSessionService.createSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/quiz/create')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        session: {
          id: 'session-1',
          name: 'Test Quiz Session',
          code: 'ABC123',
          status: QuizSessionStatus.WAITING,
          currentRound: 1,
          createdAt: new Date('2024-01-01T10:00:00Z')
        }
      });

      expect(mockSessionService.createSession).toHaveBeenCalledWith('Test Quiz Session');
    });

    it('should return 400 when name is missing', async () => {
      const requestData = {};

      const response = await request(app)
        .post('/api/quiz/create')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Session name is required'
      });

      expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });

    it('should return 400 when name is empty string', async () => {
      const requestData = {
        name: ''
      };

      const response = await request(app)
        .post('/api/quiz/create')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Session name is required'
      });
    });

    it('should handle service errors', async () => {
      const requestData = {
        name: 'Test Quiz Session'
      };

      mockSessionService.createSession.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/quiz/create')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Database error'
      });
    });
  });

  describe('GET /quiz/:sessionCode', () => {
    it('should return session details when session exists', async () => {
      const sessionCode = 'ABC123';
      const mockSession = {
        id: 'session-1',
        name: 'Test Quiz',
        code: sessionCode,
        status: QuizSessionStatus.ACTIVE,
        current_round: 2,
        created_at: new Date('2024-01-01T10:00:00Z')
      };

      mockSessionService.getSession.mockResolvedValue(mockSession);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}`)
        .expect(200);

      expect(response.body).toEqual({
        session: {
          id: 'session-1',
          name: 'Test Quiz',
          code: sessionCode,
          status: QuizSessionStatus.ACTIVE,
          currentRound: 2,
          createdAt: new Date('2024-01-01T10:00:00Z')
        }
      });

      expect(mockSessionService.getSession).toHaveBeenCalledWith(sessionCode, []);
    });

    it('should return 404 when session not found', async () => {
      const sessionCode = 'INVALID';

      mockSessionService.getSession.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });

    it('should handle service errors', async () => {
      const sessionCode = 'ABC123';

      mockSessionService.getSession.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Database error'
      });
    });
  });

  describe('PUT /quiz/:sessionCode/status', () => {
    it('should update session status successfully', async () => {
      const sessionCode = 'ABC123';
      const requestData = {
        status: QuizSessionStatus.ACTIVE
      };

      mockSessionService.updateSessionStatus.mockResolvedValue(undefined);

      const response = await request(app)
        .put(`/api/quiz/${sessionCode}/status`)
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Session status updated successfully'
      });

      expect(mockSessionService.updateSessionStatus).toHaveBeenCalledWith(
        sessionCode,
        QuizSessionStatus.ACTIVE
      );
    });

    it('should return 400 when status is missing', async () => {
      const sessionCode = 'ABC123';
      const requestData = {};

      const response = await request(app)
        .put(`/api/quiz/${sessionCode}/status`)
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Status is required'
      });

      expect(mockSessionService.updateSessionStatus).not.toHaveBeenCalled();
    });

    it('should handle invalid status values', async () => {
      const sessionCode = 'ABC123';
      const requestData = {
        status: 'INVALID_STATUS'
      };

      const response = await request(app)
        .put(`/api/quiz/${sessionCode}/status`)
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid status value'
      });
    });

    it('should handle service errors', async () => {
      const sessionCode = 'ABC123';
      const requestData = {
        status: QuizSessionStatus.ACTIVE
      };

      mockSessionService.updateSessionStatus.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .put(`/api/quiz/${sessionCode}/status`)
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('POST /quiz/:sessionCode/end', () => {
    it('should end session successfully', async () => {
      const sessionCode = 'ABC123';

      mockSessionService.endSession.mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/end`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Session ended successfully'
      });

      expect(mockSessionService.endSession).toHaveBeenCalledWith(sessionCode);
    });

    it('should handle session not found error', async () => {
      const sessionCode = 'INVALID';

      mockSessionService.endSession.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/end`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('POST /quiz/:sessionCode/next-round', () => {
    it('should start next round successfully', async () => {
      const sessionCode = 'ABC123';

      mockSessionService.startNextRound.mockResolvedValue(3);

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/next-round`)
        .expect(200);

      expect(response.body).toEqual({
        newRound: 3,
        message: 'Started round 3'
      });

      expect(mockSessionService.startNextRound).toHaveBeenCalledWith(sessionCode);
    });

    it('should handle service errors', async () => {
      const sessionCode = 'INVALID';

      mockSessionService.startNextRound.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/next-round`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('GET /quiz/:sessionCode/events', () => {
    it('should return session events with default pagination', async () => {
      const sessionCode = 'ABC123';
      const mockEventsResult = {
        events: [
          { id: 'event-1', event_type: 'SESSION_STARTED', created_at: new Date() },
          { id: 'event-2', event_type: 'QUESTION_STARTED', created_at: new Date() }
        ],
        total: 2
      };

      mockSessionService.getSessionEvents.mockResolvedValue(mockEventsResult);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/events`)
        .expect(200);

      expect(response.body).toEqual(mockEventsResult);
      expect(mockSessionService.getSessionEvents).toHaveBeenCalledWith(sessionCode, {});
    });

    it('should return events with custom pagination', async () => {
      const sessionCode = 'ABC123';
      const mockEventsResult = {
        events: [],
        total: 0
      };

      mockSessionService.getSessionEvents.mockResolvedValue(mockEventsResult);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/events`)
        .query({ limit: 10, offset: 20 })
        .expect(200);

      expect(mockSessionService.getSessionEvents).toHaveBeenCalledWith(sessionCode, {
        limit: 10,
        offset: 20
      });
    });

    it('should filter events by type', async () => {
      const sessionCode = 'ABC123';
      const mockEventsResult = {
        events: [{ id: 'event-1', event_type: 'QUESTION_STARTED' }],
        total: 1
      };

      mockSessionService.getSessionEvents.mockResolvedValue(mockEventsResult);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/events`)
        .query({ eventType: 'QUESTION_STARTED' })
        .expect(200);

      expect(mockSessionService.getSessionEvents).toHaveBeenCalledWith(sessionCode, {
        eventType: 'QUESTION_STARTED'
      });
    });

    it('should handle session not found error', async () => {
      const sessionCode = 'INVALID';

      mockSessionService.getSessionEvents.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/events`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('GET /quiz/:sessionCode/leaderboard', () => {
    it('should return leaderboard for session', async () => {
      const sessionCode = 'ABC123';
      const mockLeaderboard = [
        {
          id: 'team-1',
          name: 'Team A',
          total_points: 25,
          answers_submitted: 8,
          correct_answers: 6
        },
        {
          id: 'team-2',
          name: 'Team B',
          total_points: 20,
          answers_submitted: 7,
          correct_answers: 5
        }
      ];

      mockTeamService.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/leaderboard`)
        .expect(200);

      expect(response.body).toEqual({
        leaderboard: mockLeaderboard
      });

      expect(mockTeamService.getLeaderboard).toHaveBeenCalledWith(sessionCode);
    });

    it('should return empty leaderboard when no teams exist', async () => {
      const sessionCode = 'ABC123';

      mockTeamService.getLeaderboard.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/leaderboard`)
        .expect(200);

      expect(response.body).toEqual({
        leaderboard: []
      });
    });

    it('should handle service errors', async () => {
      const sessionCode = 'INVALID';

      mockTeamService.getLeaderboard.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/leaderboard`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('GET /quiz/:sessionCode/questions', () => {
    it('should return all questions for session', async () => {
      const sessionCode = 'ABC123';
      const mockQuestions = [
        {
          id: 'q1',
          round_number: 1,
          question_number: 1,
          question_text: 'Question 1',
          type: 'open_text'
        },
        {
          id: 'q2',
          round_number: 1,
          question_number: 2,
          question_text: 'Question 2',
          type: 'multiple_choice'
        }
      ];

      mockQuestionService.getQuestionsForSession.mockResolvedValue(mockQuestions);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/questions`)
        .expect(200);

      expect(response.body).toEqual({
        questions: mockQuestions
      });

      expect(mockQuestionService.getQuestionsForSession).toHaveBeenCalledWith(sessionCode);
    });

    it('should return questions for specific round', async () => {
      const sessionCode = 'ABC123';
      const round = 2;
      const mockQuestions = [
        {
          id: 'q3',
          round_number: 2,
          question_number: 1,
          question_text: 'Round 2 Question 1',
          type: 'open_text'
        }
      ];

      mockQuestionService.getQuestionsForSession.mockResolvedValue(mockQuestions);

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/questions`)
        .query({ round: round })
        .expect(200);

      expect(response.body).toEqual({
        questions: mockQuestions
      });

      expect(mockQuestionService.getQuestionsForSession).toHaveBeenCalledWith(sessionCode, round);
    });

    it('should handle session not found error', async () => {
      const sessionCode = 'INVALID';

      mockQuestionService.getQuestionsForSession.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .get(`/api/quiz/${sessionCode}/questions`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('POST /quiz/:sessionCode/questions/bulk', () => {
    it('should create multiple questions successfully', async () => {
      const sessionCode = 'ABC123';
      const requestData = {
        questions: [
          {
            roundNumber: 1,
            questionNumber: 1,
            type: 'open_text',
            questionText: 'What is the capital of France?',
            correctAnswer: 'Paris'
          },
          {
            roundNumber: 1,
            questionNumber: 2,
            type: 'multiple_choice',
            questionText: 'Which is the largest continent?',
            options: ['Asia', 'Africa', 'Europe', 'North America'],
            correctAnswer: 'Asia'
          }
        ]
      };

      const mockCreatedQuestions = [
        { id: 'q1', question_text: 'What is the capital of France?' },
        { id: 'q2', question_text: 'Which is the largest continent?' }
      ];

      mockQuestionService.bulkCreateQuestions.mockResolvedValue(mockCreatedQuestions);

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/questions/bulk`)
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        questions: mockCreatedQuestions,
        count: 2
      });

      expect(mockQuestionService.bulkCreateQuestions).toHaveBeenCalledWith(
        sessionCode,
        requestData.questions
      );
    });

    it('should return 400 when questions array is missing', async () => {
      const sessionCode = 'ABC123';
      const requestData = {};

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/questions/bulk`)
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Questions array is required'
      });

      expect(mockQuestionService.bulkCreateQuestions).not.toHaveBeenCalled();
    });

    it('should return 400 when questions array is empty', async () => {
      const sessionCode = 'ABC123';
      const requestData = {
        questions: []
      };

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/questions/bulk`)
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Questions array cannot be empty'
      });
    });

    it('should handle service errors', async () => {
      const sessionCode = 'INVALID';
      const requestData = {
        questions: [{ roundNumber: 1, questionNumber: 1, type: 'open_text', questionText: 'Test' }]
      };

      mockQuestionService.bulkCreateQuestions.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post(`/api/quiz/${sessionCode}/questions/bulk`)
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Session not found'
      });
    });
  });

  describe('GET /quiz/cleanup/stats', () => {
    it('should return cleanup statistics', async () => {
      const mockStats = {
        totalSessions: 50,
        activeSessions: 15,
        finishedSessions: 30,
        inactiveSessions: 5
      };

      mockSessionService.getCleanupStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/quiz/cleanup/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(mockSessionService.getCleanupStats).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockSessionService.getCleanupStats.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/quiz/cleanup/stats')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Database error'
      });
    });
  });

  describe('GET /quiz/cleanup/status', () => {
    it('should return cleanup service status', async () => {
      const mockStatus = {
        isRunning: true,
        config: {
          enabled: true,
          intervalMinutes: 60,
          inactiveHours: 4,
          logCleanup: true
        }
      };

      mockCleanupService.getStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/api/quiz/cleanup/status')
        .expect(200);

      expect(response.body).toEqual(mockStatus);
      expect(mockCleanupService.getStatus).toHaveBeenCalled();
    });
  });

  describe('POST /quiz/cleanup/start', () => {
    it('should start cleanup service successfully', async () => {
      mockCleanupService.start.mockReturnValue(undefined);

      const response = await request(app)
        .post('/api/quiz/cleanup/start')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Cleanup service started'
      });

      expect(mockCleanupService.start).toHaveBeenCalled();
    });

    it('should handle errors when starting cleanup service', async () => {
      mockCleanupService.start.mockImplementation(() => {
        throw new Error('Service already running');
      });

      const response = await request(app)
        .post('/api/quiz/cleanup/start')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Service already running'
      });
    });
  });

  describe('POST /quiz/cleanup/stop', () => {
    it('should stop cleanup service successfully', async () => {
      mockCleanupService.stop.mockReturnValue(undefined);

      const response = await request(app)
        .post('/api/quiz/cleanup/stop')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Cleanup service stopped'
      });

      expect(mockCleanupService.stop).toHaveBeenCalled();
    });

    it('should handle errors when stopping cleanup service', async () => {
      mockCleanupService.stop.mockImplementation(() => {
        throw new Error('Service not running');
      });

      const response = await request(app)
        .post('/api/quiz/cleanup/stop')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Service not running'
      });
    });
  });

  describe('Input validation', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/quiz/create')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express should handle malformed JSON with built-in error handler
    });

    it('should handle very large request bodies gracefully', async () => {
      const largeRequestData = {
        name: 'A'.repeat(10000) // Very long name
      };

      mockSessionService.createSession.mockResolvedValue({
        id: 'session-1',
        name: largeRequestData.name,
        code: 'ABC123'
      } as any);

      const response = await request(app)
        .post('/api/quiz/create')
        .send(largeRequestData)
        .expect(201);

      expect(mockSessionService.createSession).toHaveBeenCalledWith(largeRequestData.name);
    });
  });
});