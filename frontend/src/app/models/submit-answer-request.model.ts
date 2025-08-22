export interface SubmitAnswerRequest {
  questionId: string;
  teamId: string;
  answer: string | string[];
}