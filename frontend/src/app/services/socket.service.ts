import { Injectable  } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { JoinSessionData } from '../models/join-session-data.model';
import { SubmitAnswerData } from '../models/submit-answer-data.model';
import { PresenterAction } from '../models/presenter-action.model';
import { TeamJoinedEvent, TeamJoinedSessionEvent, ExistingTeamsEvent } from '../models/team-events.model';
import { QuestionStartedEvent, AnswerReceivedEvent, ReviewAnswersEvent } from '../models/question-events.model';
import { LeaderboardUpdatedEvent, RoundStartedEvent, SessionEndedEvent, SessionEndedErrorEvent } from '../models/session-events.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 100;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private lastSessionData: JoinSessionData | null = null;
  private lastRoomData: string | null = null;
  private visibilityChangeHandler: (() => void) | null = null;

  // Event subjects
  private teamJoinedSubject = new Subject<TeamJoinedEvent>();
  private teamJoinedSessionSubject = new Subject<TeamJoinedSessionEvent>();
  private existingTeamsSubject = new Subject<ExistingTeamsEvent>();
  private questionStartedSubject = new Subject<QuestionStartedEvent>();
  private questionEndedSubject = new Subject<void>();
  private leaderboardUpdatedSubject = new Subject<LeaderboardUpdatedEvent>();
  private reviewAnswersSubject = new Subject<ReviewAnswersEvent>();
  private answerReceivedSubject = new Subject<AnswerReceivedEvent>();
  private roundStartedSubject = new Subject<RoundStartedEvent>();
  private sessionEndedSubject = new Subject<SessionEndedEvent>();
  private sessionEndedErrorSubject = new Subject<SessionEndedErrorEvent>();
  private errorSubject = new Subject<{ message: string }>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  // Observables
  public teamJoined$ = this.teamJoinedSubject.asObservable();
  public teamJoinedSession$ = this.teamJoinedSessionSubject.asObservable();
  public existingTeams$ = this.existingTeamsSubject.asObservable();
  public questionStarted$ = this.questionStartedSubject.asObservable();
  public questionEnded$ = this.questionEndedSubject.asObservable();
  public leaderboardUpdated$ = this.leaderboardUpdatedSubject.asObservable();
  public reviewAnswers$ = this.reviewAnswersSubject.asObservable();
  public answerReceived$ = this.answerReceivedSubject.asObservable();
  public roundStarted$ = this.roundStartedSubject.asObservable();
  public sessionEnded$ = this.sessionEndedSubject.asObservable();
  public sessionEndedError$ = this.sessionEndedErrorSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  connect(): void {
    if (this.socket && this.connected) {
      return;
    }

    this.setupVisibilityChangeHandler();
    this.performConnection();
  }

  private performConnection(): void {
    // For Socket.IO, we need to connect to the base server URL
    // In production, use the same origin as the frontend
    // In development, use the base server URL (without /api)
    const socketUrl = environment.production ? window.location.origin : 'http://localhost:3000';
    
    console.log('🔌 Connecting to Socket.IO server at:', socketUrl);
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      // Enhanced configuration for iOS Safari compatibility
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.isReconnecting = false;
      this.connectionStatusSubject.next(true);
      
      // Rejoin session/room if we have previous data
      this.rejoinSessionIfNeeded();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected from Socket.IO server, reason:', reason);
      this.connected = false;
      this.connectionStatusSubject.next(false);
      
      // Only attempt reconnection if not manually disconnected
      if (reason !== 'io client disconnect' && !this.isReconnecting) {
        this.scheduleReconnection();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔌 Connection error:', error);
      this.connected = false;
      this.connectionStatusSubject.next(false);
      
      if (!this.isReconnecting) {
        this.scheduleReconnection();
      }
    });

    this.socket.on('team_joined', (data: TeamJoinedEvent) => {
      console.log('👥 Team joined:', data);
      this.teamJoinedSubject.next(data);
    });

    this.socket.on('team_joined_session', (data: TeamJoinedSessionEvent) => {
      console.log('👥 Team joined session:', data);
      this.teamJoinedSessionSubject.next(data);
    });

    this.socket.on('existing_teams', (data: ExistingTeamsEvent) => {
      console.log('📋 Existing teams received:', data);
      this.existingTeamsSubject.next(data);
    });

    this.socket.on('question_started', (data: QuestionStartedEvent) => {
      console.log('❓ Question started:', data);
      console.log('❓ Emitting to questionStartedSubject');
      this.questionStartedSubject.next(data);
    });

    this.socket.on('question_ended', () => {
      console.log('⏹️ Question ended');
      this.questionEndedSubject.next();
    });

    this.socket.on('leaderboard_updated', (data: LeaderboardUpdatedEvent) => {
      console.log('📊 Leaderboard updated:', data);
      this.leaderboardUpdatedSubject.next(data);
    });

    this.socket.on('review_answers', (data: ReviewAnswersEvent) => {
      console.log('📝 Review answers:', data);
      this.reviewAnswersSubject.next(data);
    });

    this.socket.on('answer_received', (data: AnswerReceivedEvent) => {
      console.log('📨 Answer received:', data);
      this.answerReceivedSubject.next(data);
    });

    this.socket.on('round_started', (data: RoundStartedEvent) => {
      console.log('🔄 Round started:', data);
      this.roundStartedSubject.next(data);
    });

    this.socket.on('error', (data: { message: string }) => {
      console.error('❌ Socket error:', data);
      this.errorSubject.next(data);
    });

    this.socket.on('session_ended', (data: SessionEndedEvent) => {
      console.log('🏁 Session ended:', data);
      this.sessionEndedSubject.next(data);
    });

    this.socket.on('session_ended_error', (data: SessionEndedErrorEvent) => {
      console.error('🚫 Session ended error:', data);
      this.sessionEndedErrorSubject.next(data);
    });

    // Handle ping/pong for connection health (iOS Safari compatibility)
    this.socket.on('ping', () => {
      console.log('🏓 Received ping from server');
      this.socket?.emit('pong');
    });

    this.socket.on('pong', () => {
      console.log('🏓 Received pong from server');
    });
  }

  private setupVisibilityChangeHandler(): void {
    if (this.visibilityChangeHandler) {
      return; // Already set up
    }

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible' && !this.connected) {
        console.log('📱 Page became visible, attempting to reconnect...');
        this.forceReconnect();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private scheduleReconnection(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🔄 Max reconnection attempts reached or already reconnecting');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.performConnection();
    }, delay);
  }

  private forceReconnect(): void {
    console.log('🔄 Force reconnecting...');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.isReconnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.performConnection();
  }

  private rejoinSessionIfNeeded(): void {
    if (this.lastSessionData) {
      console.log('🔄 Rejoining session after reconnection:', this.lastSessionData);
      setTimeout(() => {
        this.joinSession(this.lastSessionData!);
      }, 100);
    } else if (this.lastRoomData) {
      console.log('🔄 Rejoining room after reconnection:', this.lastRoomData);
      setTimeout(() => {
        this.joinRoom(this.lastRoomData!);
      }, 100);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }

    // Clear stored session data
    this.lastSessionData = null;
    this.lastRoomData = null;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  joinSession(data: JoinSessionData): void {
    if (this.socket) {
      console.log('🔗 Joining session:', data);
      this.lastSessionData = data; // Store for reconnection
      this.lastRoomData = null; // Clear room data
      this.socket.emit('join_session', data);
    }
  }

  joinRoom(sessionCode: string): void {
    if (this.socket) {
      console.log('🔗 Joining room:', sessionCode);
      this.lastRoomData = sessionCode; // Store for reconnection
      this.lastSessionData = null; // Clear session data
      this.socket.emit('join_room', { sessionCode });
    }
  }

  submitAnswer(data: SubmitAnswerData): void {
    if (this.socket) {
      console.log('📝 Submitting answer:', data);
      this.socket.emit('submit_answer', data);
    }
  }

  presenterAction(data: PresenterAction): void {
    if (this.socket) {
      console.log('🎮 Presenter action:', data);
      this.socket.emit('presenter_action', data);
    } else {
      console.error('❌ Socket not connected, cannot send presenter action');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Helper methods for specific presenter actions
  startQuestion(sessionCode: string, questionId: string): void {
    this.presenterAction({
      sessionCode,
      action: 'start_question',
      questionId
    });
  }

  endQuestion(sessionCode: string): void {
    this.presenterAction({
      sessionCode,
      action: 'end_question'
    });
  }

  showLeaderboard(sessionCode: string): void {
    this.presenterAction({
      sessionCode,
      action: 'show_leaderboard'
    });
  }

  showReview(sessionCode: string, questionId: string): void {
    this.presenterAction({
      sessionCode,
      action: 'show_review',
      questionId
    });
  }

  nextRound(sessionCode: string): void {
    this.presenterAction({
      sessionCode,
      action: 'next_round'
    });
  }

  // Enhanced methods for improved components
  on(eventName: string): Observable<unknown> {
    const subject = new Subject<unknown>();
    
    if (this.socket) {
      this.socket.on(eventName, (data: unknown) => {
        subject.next(data);
      });
    }
    
    return subject.asObservable();
  }

  emit(eventName: string, data?: unknown): void {
    if (this.socket && this.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn(`Cannot emit ${eventName}: Socket not connected`);
    }
  }

  // Removed duplicate - using existing method with different signature

  leaveSession(): void {
    this.emit('leave_session');
  }
}
