export interface QuestionSubmission {
  question_id: number;
  team_id: number;
  answer: string | string[];
  submitted_at: Date;
  time_taken?: number;
}