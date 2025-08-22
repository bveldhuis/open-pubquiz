import { Question } from './question.model';

export interface QuizState {
  currentQuestion?: Question;
  timeRemaining?: number;
  isActive: boolean;
  submissionsReceived: number;
  totalTeams: number;
}