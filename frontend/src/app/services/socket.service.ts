import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JoinSessionData {
  sessionCode: string;
  teamName: string;
}

export interface SubmitAnswerData {
  sessionCode: string;
  teamId: string;
  questionId: string;
  answer: string | string[];
}

export interface PresenterAction {
  sessionCode: string;
  action: 'start_question' | 'end_question' | 'show_leaderboard' | 'show_review' | 'next_round';
  questionId?: string;
}

export interface TeamJoinedEvent {
  teamId: string;
  teamName: string;
  sessionStatus: string;
}

export interface QuestionStartedEvent {
  question: any;
  timeLimit?: number;
}

export interface LeaderboardUpdatedEvent {
  teams: any[];
}

export interface ReviewAnswersEvent {
  questionId: string;
  answers: Array<{
    teamName: string;
    answer: string;
    isCorrect?: boolean;
    pointsAwarded: number;
  }>;
}

export interface AnswerReceivedEvent {
  teamId: string;
  teamName: string;
  questionId: string;
}

export interface RoundStartedEvent {
  roundNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  // Event subjects
  private teamJoinedSubject = new Subject<TeamJoinedEvent>();
  private questionStartedSubject = new Subject<QuestionStartedEvent>();
  private questionEndedSubject = new Subject<void>();
  private leaderboardUpdatedSubject = new Subject<LeaderboardUpdatedEvent>();
  private reviewAnswersSubject = new Subject<ReviewAnswersEvent>();
  private answerReceivedSubject = new Subject<AnswerReceivedEvent>();
  private roundStartedSubject = new Subject<RoundStartedEvent>();
  private errorSubject = new Subject<{ message: string }>();

  // Observables
  public teamJoined$ = this.teamJoinedSubject.asObservable();
  public questionStarted$ = this.questionStartedSubject.asObservable();
  public questionEnded$ = this.questionEndedSubject.asObservable();
  public leaderboardUpdated$ = this.leaderboardUpdatedSubject.asObservable();
  public reviewAnswers$ = this.reviewAnswersSubject.asObservable();
  public answerReceived$ = this.answerReceivedSubject.asObservable();
  public roundStarted$ = this.roundStartedSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor() {}

  connect(): void {
    if (this.socket && this.connected) {
      return;
    }

    this.socket = io(environment.apiUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server');
      this.connected = false;
    });

    this.socket.on('team_joined', (data: TeamJoinedEvent) => {
      console.log('👥 Team joined:', data);
      this.teamJoinedSubject.next(data);
    });

    this.socket.on('question_started', (data: QuestionStartedEvent) => {
      console.log('❓ Question started:', data);
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
}
