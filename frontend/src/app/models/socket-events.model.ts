export interface TeamJoinedEvent {
  teamId: string;
  teamName: string;
  sessionStatus: string;
}

export interface TeamJoinedSessionEvent {
  teamId: string;
  teamName: string;
}

export interface ExistingTeamsEvent {
  teams: Array<{
    id: string;
    name: string;
  }>;
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

export interface SessionEndedEvent {
  teams: any[];
}

export interface SessionEndedErrorEvent {
  message: string;
}