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

      const mockSubmitResult = {
        isCorrect: true,
        points: 5,
        message: 'Correct answer!',
        correctAnswer: 'Paris'
      };

      mockAnswerService.submitAnswer.mockResolvedValue(mockSubmitResult);

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual(mockSubmitResult);
      expect(mockAnswerService.submitAnswer).toHaveBeenCalledWith(
        'team-1',
        'question-1',
        'Paris'
      );
    });

    it('should submit sequence answer successfully', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: ['First', 'Second', 'Third']
      };

      const mockSubmitResult = {
        isCorrect: true,
        points: 3,
        message: 'Perfect sequence!',
        correctAnswer: ['First', 'Second', 'Third']
      };

      mockAnswerService.submitAnswer.mockResolvedValue(mockSubmitResult);

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual(mockSubmitResult);
      expect(mockAnswerService.submitAnswer).toHaveBeenCalledWith(
        'team-1',
        'question-1',
        ['First', 'Second', 'Third']
      );
    });

    it('should submit numerical answer successfully', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: '42'
      };

      const mockSubmitResult = {
        isCorrect: true,
        points: 2,
        message: 'Correct!',
        correctAnswer: '42'
      };

      mockAnswerService.submitAnswer.mockResolvedValue(mockSubmitResult);

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual(mockSubmitResult);
    });

    it('should return incorrect answer result', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: 'London'
      };

      const mockSubmitResult = {
        isCorrect: false,
        points: 0,
        message: 'Incorrect answer',
        correctAnswer: 'Paris'
      };

      mockAnswerService.submitAnswer.mockResolvedValue(mockSubmitResult);

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual(mockSubmitResult);
    });

    it('should return 400 when team ID is missing', async () => {
      const requestData = {
        questionId: 'question-1',
        answer: 'Paris'
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });

      expect(mockAnswerService.submitAnswer).not.toHaveBeenCalled();
    });

    it('should return 400 when question ID is missing', async () => {
      const requestData = {
        teamId: 'team-1',
        answer: 'Paris'
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });
    });

    it('should return 400 when answer is missing', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1'
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });
    });

    it('should return 400 when answer is empty string', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: ''
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });
    });

    it('should return 400 when answer is empty array', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: []
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
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
        .post('/api/answers/submit')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Team not found'
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
        .post('/api/answers/submit')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Question not found'
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
        .post('/api/answers/submit')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Answer already submitted for this question'
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
        .post('/api/answers/submit')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Database connection failed'
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
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });
    });

    it('should handle undefined values in request body', async () => {
      const requestData = {
        teamId: undefined,
        questionId: undefined,
        answer: undefined
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });
    });

    it('should handle mixed valid and invalid data', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: '', // Empty string
        answer: 'Paris'
      };

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Team ID, question ID, and answer are required'
      });
    });

    it('should accept zero as valid numerical answer', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: '0'
      };

      const mockSubmitResult = {
        isCorrect: true,
        points: 1,
        message: 'Correct!',
        correctAnswer: '0'
      };

      mockAnswerService.submitAnswer.mockResolvedValue(mockSubmitResult);

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual(mockSubmitResult);
    });

    it('should accept false as valid boolean answer', async () => {
      const requestData = {
        teamId: 'team-1',
        questionId: 'question-1',
        answer: false
      };

      const mockSubmitResult = {
        isCorrect: true,
        points: 1,
        message: 'Correct!',
        correctAnswer: false
      };

      mockAnswerService.submitAnswer.mockResolvedValue(mockSubmitResult);

      const response = await request(app)
        .post('/api/answers/submit')
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual(mockSubmitResult);
    });
  });
});