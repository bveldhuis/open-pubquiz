export interface RoundConfiguration {
  roundNumber: number;
  themeId: string;
  themeName: string;
  questionTypes: {
    type: string;
    enabled: boolean;
    questionCount: number;
    maxAvailable: number;
  }[];
  totalQuestions: number;
}

export interface SessionConfiguration {
  id: string;
  quiz_session_id: string;
  total_rounds: number;
  round_configurations: RoundConfiguration[];
  created_at: string;
  updated_at: string;
}
