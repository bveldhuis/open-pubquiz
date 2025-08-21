import { Question, QuestionType } from '../../entities/Question';

export interface IQuestionService {
  createQuestion(questionData: {
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
  }): Promise<Question>;
  getQuestionsForSession(sessionCode: string, round?: number): Promise<Question[]>;
  getQuestionById(questionId: string): Promise<Question | null>;
  getQuestionByIdOrThrow(questionId: string): Promise<Question>;
  updateQuestion(questionId: string, updateData: Partial<Question>): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  bulkCreateQuestions(sessionCode: string, questions: any[]): Promise<Question[]>;
  startQuestion(sessionCode: string, questionId: string): Promise<Question>;
  endQuestion(sessionCode: string): Promise<void>;
}
