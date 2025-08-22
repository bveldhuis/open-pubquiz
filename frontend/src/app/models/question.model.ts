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
