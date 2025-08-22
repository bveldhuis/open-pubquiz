import { RoundConfiguration } from './round-configuration.model';

export interface SessionConfiguration {
  id: string;
  quiz_session_id: string;
  total_rounds: number;
  round_configurations: RoundConfiguration[];
  created_at: string;
  updated_at: string;
}
