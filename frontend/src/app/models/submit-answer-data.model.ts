export interface SubmitAnswerData {
  sessionCode: string;
  teamId: string;
  questionId: string;
  answer: string | string[];
}