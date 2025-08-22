export interface QuizSession {
  id: string;
  code: string;
  name: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  current_question_id?: string;
  current_round: number;
  created_at: string;
  updated_at: string;
  qrCode?: string;
}