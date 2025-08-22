export interface QuestionResult {
  question_id: number;
  team_id: number;
  answer: string | string[];
  correct_answer: string | string[];
  is_correct: boolean;
  points_earned: number;
  time_taken: number;
}