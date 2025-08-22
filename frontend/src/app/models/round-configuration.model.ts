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
