import { Answer } from '../../entities/Answer';
import { Team } from '../../entities/Team';

export interface SubmitAnswerResult {
  answer: Answer;
  team: Team;
  isCorrect: boolean | null;
  pointsAwarded: number;
}

export interface IAnswerService {
  submitAnswer(questionId: string, teamId: string, answer: string | string[]): Promise<SubmitAnswerResult>;
  getAnswersForQuestion(questionId: string): Promise<Answer[]>;
  getAnswersForTeam(teamId: string): Promise<Answer[]>;
  getAnswerById(answerId: string): Promise<Answer | null>;
  scoreAnswer(answerId: string, points: number, isCorrect: boolean): Promise<void>;
  deleteAnswer(answerId: string): Promise<void>;
}
