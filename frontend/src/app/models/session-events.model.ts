export interface LeaderboardUpdatedEvent {
  teams: any[];
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