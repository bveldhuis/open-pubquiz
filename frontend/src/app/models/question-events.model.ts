export interface QuestionStartedEvent {
  question: unknown;
  timeLimit?: number;
}

export interface AnswerReceivedEvent {
  teamId: string;
  teamName: string;
  questionId: string;
}

export interface ReviewAnswersEvent {
  questionId: string;
  answers: {
    teamName: string;
    answer: string;
    isCorrect?: boolean;
    pointsAwarded: number;
  }[];
}