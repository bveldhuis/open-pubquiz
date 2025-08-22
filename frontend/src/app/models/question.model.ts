export interface Question {
  id: string;
  quiz_session_id: string;
  round_number: number;
  question_number: number;
  type: 'multiple_choice' | 'open_text' | 'sequence' | 'true_false' | 'numerical' | 'image' | 'audio' | 'video';
  question_text: string;
  fun_fact?: string;
  time_limit?: number;
  points: number;
  options?: string[];
  correct_answer?: string;
  sequence_items?: string[];
  media_url?: string;
  numerical_answer?: number;
  numerical_tolerance?: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionSubmission {
  question_id: number;
  team_id: number;
  answer: string | string[];
  submitted_at: Date;
  time_taken?: number;
}

export interface QuestionResult {
  question_id: number;
  team_id: number;
  answer: string | string[];
  correct_answer: string | string[];
  is_correct: boolean;
  points_earned: number;
  time_taken: number;
}
