import { Team } from './team.model';

export interface Answer {
  id: string;
  question_id: string;
  team_id: string;
  answer_text: string;
  is_correct?: boolean;
  points_awarded: number;
  submitted_at: string;
  team?: Team;
  sequenceAnswers?: SequenceAnswer[];
}

export interface SequenceAnswer {
  id: string;
  answer_id: string;
  item_text: string;
  position: number;
}