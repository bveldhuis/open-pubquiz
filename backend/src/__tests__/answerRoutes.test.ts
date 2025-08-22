import request from 'supertest';
import express from 'express';
import { ServiceFactory } from '../services/ServiceFactory';

// Mock the entire ServiceFactory module
jest.mock('../services/ServiceFactory');

// Create mocks for services
const mockAnswerService = {
  submitAnswer: jest.fn(),
};

const mockQuestionService = {
  getQuestionByIdOrThrow: jest.fn(),
};

const mockTeamService = {
  getTeamByIdOrThrow: jest.fn(),
};

const mockSessionService = {
  getSessionByCodeOrThrow: jest.fn(),
};

// Mock ServiceFactory
const mockServiceFactory = {
  getInstance: jest.fn().mockReturnValue({
    createAnswerService: jest.fn().mockReturnValue(mockAnswerService),
    createQuestionService: jest.fn().mockReturnValue(mockQuestionService),
    createTeamService: jest.fn().mockReturnValue(mockTeamService),
    createSessionService: jest.fn().mockReturnValue(mockSessionService),
  }),
};

(ServiceFactory as any).getInstance = mockServiceFactory.getInstance;

describe('Answer Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app and load routes
    app = express();
    app.use(express.json());
    
    // Import routes after mocks are set up
    const { answerRoutes } = require('../routes/answerRoutes');
    app.use('/api/answers', answerRoutes);
  });

  describe('POST /answers/submit', () => {
    it('should submit text answer successfully', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 'Paris'
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: 'Paris',
        is_correct: true,
        points_awarded: 5,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: 'Paris',
          isCorrect: true,
          pointsAwarded: 5,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
      expect(mockAnswerService.submitAnswer).toHaveBeenCalledWith(
        'question-1',
        'team-1',
        'Paris'
      );
    });

    it('should submit sequence answer successfully', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: [2, 0, 1, 3]
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: '[2,0,1,3]',
        is_correct: true,
        points_awarded: 3,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: '[2,0,1,3]',
          isCorrect: true,
          pointsAwarded: 3,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
      expect(mockAnswerService.submitAnswer).toHaveBeenCalledWith(
        'question-1',
        'team-1',
        [2, 0, 1, 3]
      );
    });

    it('should submit numerical answer successfully', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 42
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: '42',
        is_correct: true,
        points_awarded: 2,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: '42',
          isCorrect: true,
          pointsAwarded: 2,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
    });

    it('should return incorrect answer result', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 'London'
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: 'London',
        is_correct: false,
        points_awarded: 0,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: 'London',
          isCorrect: false,
          pointsAwarded: 0,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
    });

    it('should return 400 when team ID is missing', async () => {
      const requestData = {
        questionId: 'question-1',
        answer: 'Paris'
      };

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Question ID, team ID, and answer are required'
      });

      expect(mockAnswerService.submitAnswer).not.toHaveBeenCalled();
    });

    it('should return 400 when question ID is missing', async () => {
      const requestData = {
        teamId: 'team-1',
        answer: 'Paris'
      };

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Question ID, team ID, and answer are required'
      });
    });

    it('should return 400 when answer is missing', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1'
      };

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Question ID, team ID, and answer are required'
      });
    });

    it('should accept empty string as valid answer', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: ''
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: '',
        is_correct: false,
        points_awarded: 0,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: '',
          isCorrect: false,
          pointsAwarded: 0,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
    });

    it('should accept empty array as valid answer', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: []
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: '[]',
        is_correct: false,
        points_awarded: 0,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: '[]',
          isCorrect: false,
          pointsAwarded: 0,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
    });

    it('should handle team not found error', async () => {
      const requestData = {
        teamId: 'nonexistent',
        questionId: 'question-1',
        answer: 'Paris'
      };

      mockAnswerService.submitAnswer.mockRejectedValue(new Error('Team not found'));

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to submit answer'
      });
    });

    it('should handle question not found error', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'nonexistent',
        answer: 'Paris'
      };

      mockAnswerService.submitAnswer.mockRejectedValue(new Error('Question not found'));

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to submit answer'
      });
    });

    it('should handle duplicate answer submission error', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 'Paris'
      };

      mockAnswerService.submitAnswer.mockRejectedValue(new Error('Answer already submitted for this question'));

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to submit answer'
      });
    });

    it('should handle database errors', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 'Paris'
      };

      mockAnswerService.submitAnswer.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to submit answer'
      });
    });
  });

  describe('Input validation edge cases', () => {
    it('should handle null values in request body', async () => {
      const requestData = {
        teamId: null,
        questionId: null,
        answer: null
      };

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Question ID, team ID, and answer are required'
      });
    });

    it('should handle undefined values in request body', async () => {
      const requestData = {
        teamId: undefined,
        questionId: undefined,
        answer: undefined
      };

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Question ID, team ID, and answer are required'
      });
    });

    it('should handle mixed valid and invalid data', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: '', // Empty string
        answer: 'Paris'
      };

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Question ID, team ID, and answer are required'
      });
    });

    it('should accept zero as valid numerical answer', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 0
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: '0',
        is_correct: true,
        points_awarded: 1,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: '0',
          isCorrect: true,
          pointsAwarded: 1,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
    });

    it('should accept false as valid boolean answer', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: false
      };

      const mockAnswer = {
        id: 'answer-1',
        question_id: 'question-1',
        team_id: 'team-1',
        answer_text: 'false',
        is_correct: true,
        points_awarded: 1,
        submitted_at: new Date('2024-01-01T10:00:00Z')
      };

      mockAnswerService.submitAnswer.mockResolvedValue({ answer: mockAnswer });

      const response = await request(app)
        .post('/api/answers')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        answer: {
          id: 'answer-1',
          questionId: 'question-1',
          teamId: 'team-1',
          answerText: 'false',
          isCorrect: true,
          pointsAwarded: 1,
          submittedAt: '2024-01-01T10:00:00.000Z'
        }
      });
    });
  });
});