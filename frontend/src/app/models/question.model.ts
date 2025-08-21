export interface Question {
  id: string;
  question_text: string;
  type: 'multiple_choice' | 'open_text' | 'sequence' | 'true_false' | 'numerical' | 'image' | 'audio' | 'video';
  points: number;
  question_number: number;
  time_limit?: number;
  fun_fact?: string;
  
  // Multiple choice specific
  options?: string[];
  correct_answer?: string;
  
  // Sequence specific
  sequence_items?: string[];
  
  // Media specific (image, audio, video)
  media_url?: string;
  
  // Numerical specific
  numerical_answer?: number;
  numerical_tolerance?: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
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
