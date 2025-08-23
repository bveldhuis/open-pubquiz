import { Injectable  } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, BehaviorSubject } from 'rxjs';

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

    // For Socket.IO, we need to connect to the same host as the frontend
    // since the backend Socket.IO server is proxied through nginx
    const socketUrl = environment.production ? window.location.origin : environment.apiUrl;
    
    console.log('🔌 Connecting to Socket.IO server at:', socketUrl);
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      this.connected = true;
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server');
      this.connected = false;
      this.connectionStatusSubject.next(false);
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
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinSession(data: JoinSessionData): void {
    if (this.socket) {
      console.log('🔗 Joining session:', data);
      this.socket.emit('join_session', data);
    }
  }

  joinRoom(sessionCode: string): void {
    if (this.socket) {
      console.log('🔗 Joining room:', sessionCode);
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
  on(eventName: string): Subject<unknown> {
    const subject = new Subject<unknown>();
    
    if (this.socket) {
      this.socket.on(eventName, (data: unknown) => {
        subject.next(data);
      });
    }
    
    return subject;
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
