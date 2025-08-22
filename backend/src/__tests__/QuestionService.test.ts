import { QuestionService } from '../services/QuestionService';
import { Question, QuestionType } from '../entities/Question';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { ISessionService } from '../services/interfaces/ISessionService';
import { Repository } from 'typeorm';

// Mock TypeORM AppDataSource
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

// Mock session service
const mockSessionService: jest.Mocked<ISessionService> = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  getSessionByCodeOrThrow: jest.fn(),
  updateSessionStatus: jest.fn(),
  updateCurrentQuestionId: jest.fn(),
  endSession: jest.fn(),
  startNextRound: jest.fn(),
  logEvent: jest.fn(),
  getSessionEvents: jest.fn(),
  joinSession: jest.fn(),
  cleanupInactiveSessions: jest.fn(),
  getCleanupStats: jest.fn(),
};

describe('QuestionService', () => {
  let questionService: QuestionService;
  let mockQuestionRepository: jest.Mocked<Repository<Question>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockQuestionRepository = {
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
    AppDataSource.getRepository.mockReturnValue(mockQuestionRepository);

    questionService = new QuestionService(mockSessionService);
  });

  describe('createQuestion', () => {
    const baseQuestionData = {
      sessionCode: 'ABC123',
      roundNumber: 1,
      questionNumber: 1,
      type: QuestionType.OPEN_TEXT,
      questionText: 'What is the capital of France?',
      correctAnswer: 'Paris'
    };

    it('should create a basic open text question', async () => {
      const mockSession = { id: 'session-1', code: 'ABC123' };
      const mockQuestion = { 
        id: 'question-1', 
        quiz_session_id: 'session-1',
        question_text: 'What is the capital of France?',
        type: QuestionType.OPEN_TEXT
      };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.create.mockReturnValue(mockQuestion as Question);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion as Question);

      const result = await questionService.createQuestion(baseQuestionData);

      expect(mockSessionService.getSessionByCodeOrThrow).toHaveBeenCalledWith('ABC123');
      expect(mockQuestionRepository.create).toHaveBeenCalledWith({
        quiz_session_id: 'session-1',
        round_number: 1,
        question_number: 1,
        type: QuestionType.OPEN_TEXT,
        question_text: 'What is the capital of France?',
        fun_fact: null,
        time_limit: null,
        points: 1,
        options: null,
        correct_answer: 'Paris',
        sequence_items: null,
        media_url: null,
        numerical_answer: null,
        numerical_tolerance: null
      });
      expect(result).toEqual(mockQuestion);
    });

    it('should create a multiple choice question with options', async () => {
      const mcQuestionData = {
        ...baseQuestionData,
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Paris', 'London', 'Berlin', 'Madrid']
      };

      const mockSession = { id: 'session-1', code: 'ABC123' };
      const mockQuestion = { id: 'question-1', type: QuestionType.MULTIPLE_CHOICE };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.create.mockReturnValue(mockQuestion as Question);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion as Question);

      await questionService.createQuestion(mcQuestionData);

      expect(mockQuestionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Paris', 'London', 'Berlin', 'Madrid']
        })
      );
    });

    it('should create a sequence question with sequence items', async () => {
      const sequenceData = {
        ...baseQuestionData,
        type: QuestionType.SEQUENCE,
        sequenceItems: ['First', 'Second', 'Third']
      };

      const mockSession = { id: 'session-1', code: 'ABC123' };
      const mockQuestion = { id: 'question-1', type: QuestionType.SEQUENCE };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.create.mockReturnValue(mockQuestion as Question);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion as Question);

      await questionService.createQuestion(sequenceData);

      expect(mockQuestionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QuestionType.SEQUENCE,
          sequence_items: ['First', 'Second', 'Third']
        })
      );
    });

    it('should create a numerical question with answer and tolerance', async () => {
      const numericalData = {
        ...baseQuestionData,
        type: QuestionType.NUMERICAL,
        numericalAnswer: 42,
        numericalTolerance: 1
      };

      const mockSession = { id: 'session-1', code: 'ABC123' };
      const mockQuestion = { id: 'question-1', type: QuestionType.NUMERICAL };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.create.mockReturnValue(mockQuestion as Question);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion as Question);

      await questionService.createQuestion(numericalData);

      expect(mockQuestionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QuestionType.NUMERICAL,
          numerical_answer: 42,
          numerical_tolerance: 1
        })
      );
    });

    it('should create a media question with media URL', async () => {
      const imageData = {
        ...baseQuestionData,
        type: QuestionType.IMAGE,
        mediaUrl: 'https://example.com/image.jpg'
      };

      const mockSession = { id: 'session-1', code: 'ABC123' };
      const mockQuestion = { id: 'question-1', type: QuestionType.IMAGE };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.create.mockReturnValue(mockQuestion as Question);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion as Question);

      await questionService.createQuestion(imageData);

      expect(mockQuestionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QuestionType.IMAGE,
          media_url: 'https://example.com/image.jpg'
        })
      );
    });

    it('should use default values for optional fields', async () => {
      const minimalData = {
        sessionCode: 'ABC123',
        roundNumber: 1,
        questionNumber: 1,
        type: QuestionType.OPEN_TEXT,
        questionText: 'Test question'
      };

      const mockSession = { id: 'session-1', code: 'ABC123' };
      const mockQuestion = { id: 'question-1' };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.create.mockReturnValue(mockQuestion as Question);
      mockQuestionRepository.save.mockResolvedValue(mockQuestion as Question);

      await questionService.createQuestion(minimalData);

      expect(mockQuestionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fun_fact: null,
          time_limit: null,
          points: 1,
          options: null,
          correct_answer: null,
          sequence_items: null,
          media_url: null,
          numerical_answer: null,
          numerical_tolerance: null
        })
      );
    });
  });

  describe('getQuestionsForSession', () => {
    it('should return all questions for session when no round specified', async () => {
      const sessionCode = 'ABC123';
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockQuestions = [
        { id: 'q1', round_number: 1, question_number: 1 },
        { id: 'q2', round_number: 1, question_number: 2 },
        { id: 'q3', round_number: 2, question_number: 1 }
      ];

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.find.mockResolvedValue(mockQuestions as Question[]);

      const result = await questionService.getQuestionsForSession(sessionCode);

      expect(mockSessionService.getSessionByCodeOrThrow).toHaveBeenCalledWith(sessionCode);
      expect(mockQuestionRepository.find).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1' },
        order: { round_number: 'ASC', question_number: 'ASC' }
      });
      expect(result).toEqual(mockQuestions);
    });

    it('should return questions for specific round', async () => {
      const sessionCode = 'ABC123';
      const round = 2;
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockQuestions = [
        { id: 'q3', round_number: 2, question_number: 1 },
        { id: 'q4', round_number: 2, question_number: 2 }
      ];

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.find.mockResolvedValue(mockQuestions as Question[]);

      const result = await questionService.getQuestionsForSession(sessionCode, round);

      expect(mockQuestionRepository.find).toHaveBeenCalledWith({
        where: { quiz_session_id: 'session-1', round_number: round },
        order: { round_number: 'ASC', question_number: 'ASC' }
      });
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('getQuestionById', () => {
    it('should return question when found', async () => {
      const questionId = 'question-1';
      const mockQuestion = { id: questionId, question_text: 'Test question' };

      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion as Question);

      const result = await questionService.getQuestionById(questionId);

      expect(mockQuestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId }
      });
      expect(result).toEqual(mockQuestion);
    });

    it('should return null when question not found', async () => {
      const questionId = 'nonexistent';

      mockQuestionRepository.findOne.mockResolvedValue(null);

      const result = await questionService.getQuestionById(questionId);

      expect(result).toBeNull();
    });
  });

  describe('getQuestionByIdOrThrow', () => {
    it('should return question when found', async () => {
      const questionId = 'question-1';
      const mockQuestion = { id: questionId, question_text: 'Test question' };

      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion as Question);

      const result = await questionService.getQuestionByIdOrThrow(questionId);

      expect(result).toEqual(mockQuestion);
    });

    it('should throw error when question not found', async () => {
      const questionId = 'nonexistent';

      mockQuestionRepository.findOne.mockResolvedValue(null);

      await expect(questionService.getQuestionByIdOrThrow(questionId))
        .rejects.toThrow('Question not found');
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const questionId = 'question-1';
      const updateData = { question_text: 'Updated question' };

      mockQuestionRepository.update.mockResolvedValue({} as any);

      await questionService.updateQuestion(questionId, updateData);

      expect(mockQuestionRepository.update).toHaveBeenCalledWith(
        questionId,
        updateData
      );
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      const questionId = 'question-1';

      await questionService.deleteQuestion(questionId);

      expect(mockQuestionRepository.delete).toHaveBeenCalledWith(questionId);
    });

    it('should delete question even if not found (no validation)', async () => {
      const questionId = 'nonexistent';

      await expect(questionService.deleteQuestion(questionId)).resolves.not.toThrow();

      expect(mockQuestionRepository.delete).toHaveBeenCalledWith(questionId);
    });
  });

  describe('bulkCreateQuestions', () => {
    it('should create multiple questions successfully', async () => {
      const sessionCode = 'ABC123';
      const questions = [
        {
          roundNumber: 1,
          questionNumber: 1,
          type: 'open_text',
          questionText: 'Question 1',
          correctAnswer: 'Answer 1'
        },
        {
          roundNumber: 1,
          questionNumber: 2,
          type: 'multiple_choice',
          questionText: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A'
        }
      ];

      const mockSession = { id: 'session-1', code: sessionCode };
      const mockCreatedQuestions = [
        { id: 'q1', question_text: 'Question 1' },
        { id: 'q2', question_text: 'Question 2' }
      ];

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      
      // Mock the create method to return the expected objects
      mockQuestionRepository.create
        .mockReturnValueOnce(mockCreatedQuestions[0] as Question)
        .mockReturnValueOnce(mockCreatedQuestions[1] as Question);
      
      mockQuestionRepository.save
        .mockResolvedValueOnce(mockCreatedQuestions[0] as Question)
        .mockResolvedValueOnce(mockCreatedQuestions[1] as Question);

      const result = await questionService.bulkCreateQuestions(sessionCode, questions);

      expect(mockSessionService.getSessionByCodeOrThrow).toHaveBeenCalledWith(sessionCode);
      expect(mockQuestionRepository.create).toHaveBeenCalledTimes(2);
      expect(mockQuestionRepository.save).toHaveBeenCalledTimes(2);
      expect(mockQuestionRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        quiz_session_id: 'session-1',
        round_number: 1,
        question_number: 1,
        type: 'open_text',
        question_text: 'Question 1'
      }));
      expect(mockQuestionRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        quiz_session_id: 'session-1',
        round_number: 1,
        question_number: 2,
        type: 'multiple_choice',
        question_text: 'Question 2'
      }));
      expect(result).toEqual(mockCreatedQuestions);
    });

    it('should throw error when session not found for bulk create', async () => {
      const sessionCode = 'INVALID';
      const questions = [{ roundNumber: 1, questionNumber: 1, type: 'open_text', questionText: 'Test' }];

      mockSessionService.getSessionByCodeOrThrow.mockRejectedValue(new Error('Session not found'));

      await expect(questionService.bulkCreateQuestions(sessionCode, questions))
        .rejects.toThrow('Session not found');

      expect(mockQuestionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('startQuestion', () => {
    it('should start question and update session status', async () => {
      const sessionCode = 'ABC123';
      const questionId = 'question-1';
      const mockSession = { id: 'session-1', code: sessionCode };
      const mockQuestion = { 
        id: questionId, 
        question_text: 'Test question',
        quiz_session_id: 'session-1'
      };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion as Question);
      mockSessionService.updateSessionStatus.mockResolvedValue();
      mockSessionService.updateCurrentQuestionId.mockResolvedValue();

      const result = await questionService.startQuestion(sessionCode, questionId);

      expect(mockSessionService.getSessionByCodeOrThrow).toHaveBeenCalledWith(sessionCode);
      expect(mockQuestionRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId }
      });
      expect(mockSessionService.updateSessionStatus).toHaveBeenCalledWith(
        sessionCode,
        QuizSessionStatus.ACTIVE
      );
      expect(mockSessionService.updateCurrentQuestionId).toHaveBeenCalledWith(
        sessionCode,
        questionId
      );
      expect(result).toEqual(mockQuestion);
    });

    it('should throw error when question not found for start', async () => {
      const sessionCode = 'ABC123';
      const questionId = 'nonexistent';
      const mockSession = { id: 'session-1', code: sessionCode };

      mockSessionService.getSessionByCodeOrThrow.mockResolvedValue(mockSession as QuizSession);
      mockQuestionRepository.findOne.mockResolvedValue(null);

      await expect(questionService.startQuestion(sessionCode, questionId))
        .rejects.toThrow('Question not found');

      expect(mockSessionService.updateSessionStatus).not.toHaveBeenCalled();
      expect(mockSessionService.updateCurrentQuestionId).not.toHaveBeenCalled();
    });
  });

  describe('endQuestion', () => {
    it('should end current question and update session', async () => {
      const sessionCode = 'ABC123';

      mockSessionService.updateCurrentQuestionId.mockResolvedValue();
      mockSessionService.updateSessionStatus.mockResolvedValue();

      await questionService.endQuestion(sessionCode);

      expect(mockSessionService.updateCurrentQuestionId).toHaveBeenCalledWith(
        sessionCode,
        null
      );
      expect(mockSessionService.updateSessionStatus).toHaveBeenCalledWith(
        sessionCode,
        QuizSessionStatus.PAUSED
      );
    });
  });
});