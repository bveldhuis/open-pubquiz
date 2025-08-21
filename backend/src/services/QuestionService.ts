import { AppDataSource } from '../config/database';
import { Question, QuestionType } from '../entities/Question';
import { QuizSessionStatus } from '../entities/QuizSession';
import { IQuestionService } from './interfaces/IQuestionService';
import { ISessionService } from './interfaces/ISessionService';

export class QuestionService implements IQuestionService {
  private questionRepository = AppDataSource.getRepository(Question);

  constructor(private sessionService: ISessionService) {}

  /**
   * Create a question
   */
  async createQuestion(questionData: {
    sessionCode: string;
    roundNumber: number;
    questionNumber: number;
    type: QuestionType;
    questionText: string;
    funFact?: string;
    timeLimit?: number;
    points?: number;
    options?: string[];
    correctAnswer?: string;
    sequenceItems?: string[];
    mediaUrl?: string;
    numericalAnswer?: number;
    numericalTolerance?: number;
  }): Promise<Question> {
    const session = await this.sessionService.getSessionByCodeOrThrow(questionData.sessionCode);
    
    const question = this.questionRepository.create({
      quiz_session_id: session.id,
      round_number: questionData.roundNumber,
      question_number: questionData.questionNumber,
      type: questionData.type,
      question_text: questionData.questionText,
      fun_fact: questionData.funFact || null,
      time_limit: questionData.timeLimit || null,
      points: questionData.points || 1,
      options: questionData.type === QuestionType.MULTIPLE_CHOICE ? questionData.options : null,
      correct_answer: questionData.correctAnswer || null,
      sequence_items: questionData.type === QuestionType.SEQUENCE ? questionData.sequenceItems : null,
      media_url: [QuestionType.IMAGE, QuestionType.AUDIO, QuestionType.VIDEO].includes(questionData.type) ? questionData.mediaUrl : null,
      numerical_answer: questionData.type === QuestionType.NUMERICAL ? questionData.numericalAnswer : null,
      numerical_tolerance: questionData.type === QuestionType.NUMERICAL ? questionData.numericalTolerance : null
    });

    return await this.questionRepository.save(question);
  }

  /**
   * Get questions for a session
   */
  async getQuestionsForSession(sessionCode: string, round?: number): Promise<Question[]> {
    const session = await this.sessionService.getSessionByCodeOrThrow(sessionCode);
    
    const whereClause: any = { quiz_session_id: session.id };
    if (round !== undefined) {
      whereClause.round_number = round;
    }
    
    return await this.questionRepository.find({
      where: whereClause,
      order: { round_number: 'ASC', question_number: 'ASC' }
    });
  }

  /**
   * Get question by ID
   */
  async getQuestionById(questionId: string): Promise<Question | null> {
    return await this.questionRepository.findOne({ where: { id: questionId } });
  }

  /**
   * Get question by ID or throw error
   */
  async getQuestionByIdOrThrow(questionId: string): Promise<Question> {
    const question = await this.getQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }
    return question;
  }

  /**
   * Update question
   */
  async updateQuestion(questionId: string, updateData: Partial<Question>): Promise<void> {
    await this.questionRepository.update(questionId, updateData);
  }

  /**
   * Delete question
   */
  async deleteQuestion(questionId: string): Promise<void> {
    await this.questionRepository.delete(questionId);
  }

  /**
   * Bulk create questions
   */
  async bulkCreateQuestions(sessionCode: string, questions: any[]): Promise<Question[]> {
    const session = await this.sessionService.getSessionByCodeOrThrow(sessionCode);
    const createdQuestions = [];

    for (const questionData of questions) {
      const {
        roundNumber,
        questionNumber,
        type,
        questionText,
        funFact,
        timeLimit,
        points,
        options,
        correctAnswer,
        sequenceItems
      } = questionData;

      if (!roundNumber || !questionNumber || !type || !questionText) {
        console.log(`⚠️ Skipping invalid question:`, questionData);
        continue;
      }

      const question = this.questionRepository.create({
        quiz_session_id: session.id,
        round_number: roundNumber,
        question_number: questionNumber,
        type,
        question_text: questionText,
        fun_fact: funFact || null,
        time_limit: timeLimit || null,
        points: points || 1,
        options: type === QuestionType.MULTIPLE_CHOICE ? options : null,
        correct_answer: correctAnswer || null,
        sequence_items: type === QuestionType.SEQUENCE ? sequenceItems : null
      });

      const savedQuestion = await this.questionRepository.save(question);
      createdQuestions.push(savedQuestion);
    }

    return createdQuestions;
  }

  /**
   * Start a question
   */
  async startQuestion(sessionCode: string, questionId: string): Promise<Question> {
    const session = await this.sessionService.getSessionByCodeOrThrow(sessionCode);
    const question = await this.getQuestionByIdOrThrow(questionId);

    // Verify question belongs to this session
    if (question.quiz_session_id !== session.id) {
      throw new Error('Question does not belong to this session');
    }

    await this.sessionService.updateSessionStatus(sessionCode, QuizSessionStatus.ACTIVE);
    await this.sessionService.updateCurrentQuestionId(sessionCode, questionId);

    return question;
  }

  /**
   * End current question
   */
  async endQuestion(sessionCode: string): Promise<void> {
    await this.sessionService.updateSessionStatus(sessionCode, QuizSessionStatus.PAUSED);
    await this.sessionService.updateCurrentQuestionId(sessionCode, null);
  }
}
