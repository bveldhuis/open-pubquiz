export interface LeaderboardUpdatedEvent {
  teams: unknown[];
}

export interface RoundStartedEvent {
  roundNumber: number;
}

export interface SessionEndedEvent {
  teams: unknown[];
}

export interface SessionEndedErrorEvent {
  message: string;
}