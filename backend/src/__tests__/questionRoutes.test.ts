import request from 'supertest';
import express from 'express';
import { ServiceFactory } from '../services/ServiceFactory';
import { QuestionType } from '../entities/Question';

// Mock the entire ServiceFactory module
jest.mock('../services/ServiceFactory');

// Create mocks for services
const mockQuestionService = {
  createQuestion: jest.fn(),
  getQuestionById: jest.fn(),
  getQuestionByIdOrThrow: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
  getQuestionsForSession: jest.fn(),
  startQuestion: jest.fn(),
  endQuestion: jest.fn(),
};

const mockSessionService = {
  getSessionByCodeOrThrow: jest.fn(),
  updateSessionStatus: jest.fn(),
  updateCurrentQuestionId: jest.fn(),
  logEvent: jest.fn(),
};

// Mock ServiceFactory
const mockServiceFactory = {
  getInstance: jest.fn().mockReturnValue({
    createQuestionService: jest.fn().mockReturnValue(mockQuestionService),
    createSessionService: jest.fn().mockReturnValue(mockSessionService),
    createTeamService: jest.fn().mockReturnValue({}),
  }),
};

(ServiceFactory as any).getInstance = mockServiceFactory.getInstance;

describe('Question Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app and load routes
    app = express();
    app.use(express.json());
    
    // Import routes after mocks are set up
    const { questionRoutes } = require('../routes/questionRoutes');
    app.use('/api/questions', questionRoutes);
  });

  describe('POST /questions', () => {
    it('should create open text question successfully', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'What is the capital of France?',
        correctAnswer: 'Paris',
        timeLimit: 30,
        points: 5
      };

      const mockQuestion = {
        id: 'question-1',
        quiz_session_id: 'session-1',
        round_number: 1,
        question_number: 1,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the capital of France?',
        correct_answer: 'Paris',
        time_limit: 30,
        points: 5,
        created_at: '2024-01-01T10:00:00.000Z'
      };

      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        question: mockQuestion
      });

      expect(mockQuestionService.createQuestion).toHaveBeenCalledWith(requestData);
    });

    it('should create multiple choice question successfully', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 2,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Which is the largest continent?',
        options: ['Asia', 'Africa', 'Europe', 'North America'],
        correctAnswer: 'Asia',
        points: 3
      };

      const mockQuestion = {
        id: 'question-2',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Asia', 'Africa', 'Europe', 'North America']
      };

      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(201);

      expect(response.body.question).toEqual(mockQuestion);
      expect(mockQuestionService.createQuestion).toHaveBeenCalledWith(requestData);
    });

    it('should create sequence question successfully', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 3,
        type: QuestionType.SEQUENCE,
        questionText: 'Order these events chronologically',
        sequenceItems: ['World War I', 'World War II', 'Cold War', 'Fall of Berlin Wall'],
        points: 4
      };

      const mockQuestion = {
        id: 'question-3',
        type: QuestionType.SEQUENCE,
        sequence_items: ['World War I', 'World War II', 'Cold War', 'Fall of Berlin Wall']
      };

      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(201);

      expect(response.body.question).toEqual(mockQuestion);
    });

    it('should create numerical question successfully', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 4,
        type: QuestionType.NUMERICAL,
        questionText: 'What is the square root of 144?',
        numericalAnswer: 12,
        numericalTolerance: 0.1,
        points: 2
      };

      const mockQuestion = {
        id: 'question-4',
        type: QuestionType.NUMERICAL,
        numerical_answer: 12,
        numerical_tolerance: 0.1
      };

      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(201);

      expect(response.body.question).toEqual(mockQuestion);
    });

    it('should create media question successfully', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 5,
        type: QuestionType.IMAGE,
        questionText: 'What building is shown in this image?',
        mediaUrl: 'https://example.com/image.jpg',
        correctAnswer: 'Eiffel Tower',
        points: 3
      };

      const mockQuestion = {
        id: 'question-5',
        type: QuestionType.IMAGE,
        media_url: 'https://example.com/image.jpg'
      };

      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(201);

      expect(response.body.question).toEqual(mockQuestion);
    });

    it('should return 400 when required fields are missing', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        // Missing questionNumber, type, questionText
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields'
      });

      expect(mockQuestionService.createQuestion).not.toHaveBeenCalled();
    });

    it('should return 400 when session code is missing', async () => {
      const requestData = {
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question'
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 when question type is invalid', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: 'INVALID_TYPE',
        questionText: 'Test question'
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('Invalid question type');
    });

    it('should handle service errors', async () => {
      const requestData = {
        sessionCode: 'INVALID',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question'
      };

      mockQuestionService.createQuestion.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to create question'
      });
    });
  });

  describe('GET /questions/:questionId', () => {
    it('should return question when found', async () => {
      const questionId = 'question-1';
      const mockQuestion = {
        id: questionId,
        question_text: 'What is the capital of France?',
        type: QuestionType.OPEN_TEXT,
        correct_answer: 'Paris',
        points: 5
      };

      mockQuestionService.getQuestionById.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .get(`/api/questions/${questionId}`)
        .expect(200);

      expect(response.body).toEqual({
        question: mockQuestion
      });

      expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(questionId);
    });

    it('should return 404 when question not found', async () => {
      const questionId = 'nonexistent';

      mockQuestionService.getQuestionById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/questions/${questionId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Question not found'
      });
    });

    it('should handle service errors', async () => {
      const questionId = 'question-1';

      mockQuestionService.getQuestionById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/questions/${questionId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch question'
      });
    });
  });

  describe('PUT /questions/:questionId', () => {
    it('should update question successfully', async () => {
      const questionId = 'question-1';
      const requestData = {
        questionText: 'Updated question text',
        points: 10
      };

      mockQuestionService.updateQuestion.mockResolvedValue(undefined);

      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual({
        success: true
      });

      expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith(questionId, requestData);
    });

    it('should handle empty update data', async () => {
      const questionId = 'question-1';
      const requestData = {};

      mockQuestionService.updateQuestion.mockResolvedValue(undefined);

      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .send(requestData)
        .expect(200);

      expect(response.body).toEqual({
        success: true
      });

      expect(mockQuestionService.updateQuestion).toHaveBeenCalledWith(questionId, {});
    });

    it('should handle question not found error', async () => {
      const questionId = 'nonexistent';
      const requestData = {
        questionText: 'Updated text'
      };

      mockQuestionService.updateQuestion.mockRejectedValue(new Error('Question not found'));

      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to update question'
      });
    });
  });

  describe('DELETE /questions/:questionId', () => {
    it('should delete question successfully', async () => {
      const questionId = 'question-1';

      mockQuestionService.deleteQuestion.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/questions/${questionId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true
      });

      expect(mockQuestionService.deleteQuestion).toHaveBeenCalledWith(questionId);
    });

    it('should handle question not found error', async () => {
      const questionId = 'nonexistent';

      mockQuestionService.deleteQuestion.mockRejectedValue(new Error('Question not found'));

      const response = await request(app)
        .delete(`/api/questions/${questionId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to delete question'
      });
    });
  });



  describe('Question type validation', () => {
    it('should validate multiple choice requires options', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.MULTIPLE_CHOICE,
        questionText: 'Test question',
        correctAnswer: 'A'
        // Missing options
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toContain('Multiple choice questions require at least 2 options');
    });

    it('should validate sequence requires sequence items', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.SEQUENCE,
        questionText: 'Order these items'
        // Missing sequenceItems
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toContain('Sequence questions require at least 2 items');
    });

    it('should validate numerical requires numerical answer', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.NUMERICAL,
        questionText: 'What is 2 + 2?'
        // Missing numericalAnswer
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toContain('Numerical questions require a numerical answer');
    });

    it('should validate media questions require media URL', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.IMAGE,
        questionText: 'What is shown in this image?'
        // Missing mediaUrl
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toContain('Media questions require a media URL');
    });
  });

  describe('Input validation edge cases', () => {
    it('should handle negative round numbers', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: -1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question'
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(500);

      expect(response.body.error).toBe('Failed to create question');
    });

    it('should handle zero question numbers', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 0,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question'
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should handle invalid points values', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question',
        points: -5
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(500);

      expect(response.body.error).toBe('Failed to create question');
    });

    it('should handle invalid time limits', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question',
        timeLimit: 0
      };

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(500);

      expect(response.body.error).toBe('Failed to create question');
    });

    it('should accept minimal valid question data', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Minimal question'
      };

      const mockQuestion = {
        id: 'question-1',
        question_text: 'Minimal question',
        type: QuestionType.OPEN_TEXT
      };

      mockQuestionService.createQuestion.mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/api/questions')
        .send(requestData)
        .expect(201);

      expect(response.body.question).toEqual(mockQuestion);
    });
  });
});