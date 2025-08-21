import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { SessionEvent, EventType } from '../entities/SessionEvent';
import { ISessionService, JoinSessionResult } from './interfaces/ISessionService';
import { ITeamService } from './interfaces/ITeamService';
import { LessThan } from 'typeorm';

export class SessionService implements ISessionService {
  private sessionRepository = AppDataSource.getRepository(QuizSession);
  private eventRepository = AppDataSource.getRepository(SessionEvent);

  constructor(private teamService: ITeamService) {}

  /**
   * Create a new quiz session
   */
  async createSession(name: string): Promise<QuizSession> {
    // Generate unique session code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let sessionCode;
    let existingSession;
    do {
      sessionCode = generateCode();
      existingSession = await this.sessionRepository.findOne({ where: { code: sessionCode } });
    } while (existingSession);

    const session = this.sessionRepository.create({
      name,
      code: sessionCode,
      status: QuizSessionStatus.WAITING,
      current_round: 1
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Get session by code with optional relations
   */
  async getSession(sessionCode: string, relations: string[] = []): Promise<QuizSession | null> {
    return await this.sessionRepository.findOne({
      where: { code: sessionCode },
      relations
    });
  }

  /**
   * Get session by code or throw error
   */
  async getSessionByCodeOrThrow(sessionCode: string, relations: string[] = []): Promise<QuizSession> {
    const session = await this.getSession(sessionCode, relations);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionCode: string, status: QuizSessionStatus): Promise<void> {
    const session = await this.getSessionByCodeOrThrow(sessionCode);
    await this.sessionRepository.update(session.id, { status });
  }

  /**
   * Update current question ID
   */
  async updateCurrentQuestionId(sessionCode: string, questionId: string | null): Promise<void> {
    const session = await this.getSessionByCodeOrThrow(sessionCode);
    await this.sessionRepository.update(session.id, { current_question_id: questionId });
  }

  /**
   * End session
   */
  async endSession(sessionCode: string): Promise<void> {
    const session = await this.getSessionByCodeOrThrow(sessionCode);
    await this.sessionRepository.update(session.id, { status: QuizSessionStatus.FINISHED });
  }

  /**
   * Start next round
   */
  async startNextRound(sessionCode: string): Promise<number> {
    const session = await this.getSessionByCodeOrThrow(sessionCode);
    
    const newRound = session.current_round + 1;
    await this.sessionRepository.update(session.id, {
      current_round: newRound,
      current_question_id: null,
      status: QuizSessionStatus.WAITING
    });

    return newRound;
  }

  /**
   * Log a session event
   */
  async logEvent(sessionId: string, eventType: EventType, eventData: any = {}): Promise<void> {
    await this.eventRepository.save({
      quiz_session_id: sessionId,
      event_type: eventType,
      event_data: eventData
    });
  }

  /**
   * Get session events
   */
  async getSessionEvents(sessionCode: string, options: {
    limit?: number;
    offset?: number;
    eventType?: EventType;
  } = {}): Promise<{ events: SessionEvent[]; total: number }> {
    const session = await this.getSessionByCodeOrThrow(sessionCode);
    
    let whereClause: any = { quiz_session_id: session.id };
    if (options.eventType) {
      whereClause.event_type = options.eventType;
    }

    const [events, total] = await this.eventRepository.findAndCount({
      where: whereClause,
      order: { created_at: 'DESC' },
      take: options.limit || 50,
      skip: options.offset || 0,
      relations: ['team', 'question']
    });

    return { events, total };
  }

  /**
   * Join session as a team
   */
  async joinSession(sessionCode: string, teamName: string): Promise<JoinSessionResult> {
    const session = await this.getSessionByCodeOrThrow(sessionCode, ['teams']);
    
    // Check if session is ended
    if (session.status === QuizSessionStatus.FINISHED) {
      throw new Error('Cannot join an ended session');
    }
    
    // Check if team name already exists in this session
    const existingTeam = session.teams.find(team => team.name === teamName);
    let team: any;
    let isNewTeam = false;

    if (!existingTeam) {
      // Create new team
      team = await this.teamService.createTeam(sessionCode, teamName);
      isNewTeam = true;
    } else {
      team = existingTeam;
    }

    return { team, session, isNewTeam };
  }

  /**
   * Find and end inactive sessions
   * Sessions are considered inactive if they haven't been updated for more than the specified hours
   */
  async cleanupInactiveSessions(inactiveHours: number = 4): Promise<{ ended: number; total: number }> {
    const inactiveThreshold = new Date();
    inactiveThreshold.setHours(inactiveThreshold.getHours() - inactiveHours);

    // Find all active sessions that haven't been updated recently
    const inactiveSessions = await this.sessionRepository.find({
      where: {
        status: QuizSessionStatus.WAITING,
        updated_at: LessThan(inactiveThreshold)
      }
    });

    let endedCount = 0;
    for (const session of inactiveSessions) {
      try {
        // End the session
        await this.sessionRepository.update(session.id, { 
          status: QuizSessionStatus.FINISHED 
        });

        // Log the cleanup event
        await this.logEvent(session.id, EventType.SESSION_ENDED, {
          reason: 'automatic_cleanup',
          inactiveHours: inactiveHours,
          lastActivity: session.updated_at
        });

        endedCount++;
        console.log(`🧹 Automatically ended inactive session: ${session.code} (${session.name})`);
      } catch (error) {
        console.error(`❌ Error ending inactive session ${session.code}:`, error);
      }
    }

    return { ended: endedCount, total: inactiveSessions.length };
  }

  /**
   * Get statistics about session cleanup
   */
  async getCleanupStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    finishedSessions: number;
    inactiveSessions: number;
  }> {
    const [totalSessions, activeSessions, finishedSessions] = await Promise.all([
      this.sessionRepository.count(),
      this.sessionRepository.count({ where: { status: QuizSessionStatus.WAITING } }),
      this.sessionRepository.count({ where: { status: QuizSessionStatus.FINISHED } })
    ]);

    // Calculate inactive sessions (not updated in last 4 hours)
    const inactiveThreshold = new Date();
    inactiveThreshold.setHours(inactiveThreshold.getHours() - 4);
    
    const inactiveSessions = await this.sessionRepository.count({
      where: {
        status: QuizSessionStatus.WAITING,
        updated_at: LessThan(inactiveThreshold)
      }
    });

    return {
      totalSessions,
      activeSessions,
      finishedSessions,
      inactiveSessions
    };
  }
}
