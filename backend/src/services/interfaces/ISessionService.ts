import { QuizSession, QuizSessionStatus } from '../../entities/QuizSession';
import { SessionEvent, EventType } from '../../entities/SessionEvent';

export interface TeamWithStats {
  id: string;
  name: string;
  total_points: number;
  answers_submitted: number;
  correct_answers: number;
}

export interface JoinSessionResult {
  team: any;
  session: QuizSession;
  isNewTeam: boolean;
}

export interface ISessionService {
  createSession(name: string): Promise<QuizSession>;
  getSession(sessionCode: string, relations?: string[]): Promise<QuizSession | null>;
  getSessionByCodeOrThrow(sessionCode: string, relations?: string[]): Promise<QuizSession>;
  updateSessionStatus(sessionCode: string, status: QuizSessionStatus): Promise<void>;
  updateCurrentQuestionId(sessionCode: string, questionId: string | null): Promise<void>;
  endSession(sessionCode: string): Promise<void>;
  startNextRound(sessionCode: string): Promise<number>;
  logEvent(sessionId: string, eventType: EventType, eventData?: any): Promise<void>;
  getSessionEvents(sessionCode: string, options?: {
    limit?: number;
    offset?: number;
    eventType?: EventType;
  }): Promise<{ events: SessionEvent[]; total: number }>;
  joinSession(sessionCode: string, teamName: string): Promise<JoinSessionResult>;
  cleanupInactiveSessions(inactiveHours?: number): Promise<{ ended: number; total: number }>;
  getCleanupStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    finishedSessions: number;
    inactiveSessions: number;
  }>;
}
