export interface PresenterAction {
  sessionCode: string;
  action: 'start_question' | 'end_question' | 'show_leaderboard' | 'show_review' | 'next_round' | 'end_session';
  questionId?: string;
  leaderboard?: unknown[];
}