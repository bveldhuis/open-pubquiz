export interface ReviewAnswer {
  id: string;
  team_id: string;
  team_name: string;
  answer: string | string[];
  is_correct: boolean;
  points_awarded: number;
  submitted_at: string;
  time_taken?: number;
}