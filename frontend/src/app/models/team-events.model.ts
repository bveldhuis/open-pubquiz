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