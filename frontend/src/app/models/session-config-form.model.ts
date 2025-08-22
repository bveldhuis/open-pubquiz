export interface QuestionTypeFormValue {
  type: string;
  enabled: boolean;
  questionCount: number;
}

export interface RoundFormValue {
  themeId: string;
  questionTypes: QuestionTypeFormValue[];
}

export interface SessionConfigFormValue {
  sessionCode?: string;
  totalRounds: number;
  roundConfigurations: RoundFormValue[];
}

export interface HttpError {
  error?: {
    error?: string;
  };
}
