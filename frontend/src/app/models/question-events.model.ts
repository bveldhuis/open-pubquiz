export interface QuestionStartedEvent {
  question: any;
  timeLimit?: number;
}

export interface AnswerReceivedEvent {
  teamId: string;
  teamName: string;
  questionId: string;
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