import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

export interface Question {
  id: string;
  quiz_session_id: string;
  round_number: number;
  question_number: number;
  type: 'multiple_choice' | 'open_text' | 'sequence';
  question_text: string;
  fun_fact?: string;
  time_limit?: number;
  points: number;
  options?: string[];
  correct_answer?: string;
  sequence_items?: string[];
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  quiz_session_id: string;
  name: string;
  total_points: number;
  joined_at: string;
  last_activity: string;
}

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

export interface CreateSessionRequest {
  name: string;
}

export interface JoinSessionRequest {
  sessionCode: string;
  teamName: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  teamId: string;
  answer: string | string[];
}

export interface ScoreAnswerRequest {
  isCorrect: boolean;
  pointsAwarded: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Session management
  createSession(request: CreateSessionRequest): Observable<{ session: QuizSession }> {
    return this.http.post<{ session: QuizSession }>(`${this.apiUrl}/api/quiz`, request);
  }

  getSession(code: string): Observable<{ session: QuizSession }> {
    return this.http.get<{ session: QuizSession }>(`${this.apiUrl}/api/quiz/${code}`);
  }

  getSessionStatus(code: string): Observable<{
    status: string;
    currentRound: number;
    currentQuestionId?: string;
    teamCount: number;
  }> {
    return this.http.get<{
      status: string;
      currentRound: number;
      currentQuestionId?: string;
      teamCount: number;
    }>(`${this.apiUrl}/api/quiz/${code}/status`);
  }

  updateSessionStatus(code: string, status: string): Observable<{ success: boolean; status: string }> {
    return this.http.patch<{ success: boolean; status: string }>(`${this.apiUrl}/api/quiz/${code}/status`, { status });
  }

  endSession(code: string): Observable<{ success: boolean; teams?: any[] }> {
    return this.http.post<{ success: boolean; teams?: any[] }>(`${this.apiUrl}/api/quiz/${code}/end`, {});
  }

  getLeaderboard(code: string): Observable<{ teams: Team[] }> {
    return this.http.get<{ teams: Team[] }>(`${this.apiUrl}/api/quiz/${code}/leaderboard`);
  }

  getSessionEvents(code: string): Observable<{ events: any[] }> {
    return this.http.get<{ events: any[] }>(`${this.apiUrl}/api/quiz/${code}/events`);
  }

  // Team management
  joinSession(request: JoinSessionRequest): Observable<{ team: Team }> {
    return this.http.post<{ team: Team }>(`${this.apiUrl}/api/teams/join`, request);
  }

  getTeam(id: string): Observable<{ team: Team }> {
    return this.http.get<{ team: Team }>(`${this.apiUrl}/api/teams/${id}`);
  }

  updateTeamPoints(id: string, points: number): Observable<{ success: boolean; totalPoints: number }> {
    return this.http.patch<{ success: boolean; totalPoints: number }>(`${this.apiUrl}/api/teams/${id}/points`, { points });
  }

  getTeamsForSession(sessionCode: string): Observable<{ teams: Team[] }> {
    return this.http.get<{ teams: Team[] }>(`${this.apiUrl}/api/teams/session/${sessionCode}`);
  }

  removeTeam(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/api/teams/${id}`);
  }

  updateTeamActivity(id: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/api/teams/${id}/activity`, {});
  }

  // Question management
  createQuestion(request: any): Observable<{ question: Question }> {
    return this.http.post<{ question: Question }>(`${this.apiUrl}/api/questions`, request);
  }

  getQuestionsForSession(sessionCode: string, round?: number): Observable<{ questions: Question[] }> {
    let params: any = {};
    if (round !== undefined) {
      params = { round: round.toString() };
    }
    return this.http.get<{ questions: Question[] }>(`${this.apiUrl}/api/questions/session/${sessionCode}`, { params });
  }

  getQuestion(id: string): Observable<{ question: Question }> {
    return this.http.get<{ question: Question }>(`${this.apiUrl}/api/questions/${id}`);
  }

  updateQuestion(id: string, request: any): Observable<{ question: Question }> {
    return this.http.put<{ question: Question }>(`${this.apiUrl}/api/questions/${id}`, request);
  }

  deleteQuestion(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/api/questions/${id}`);
  }

  createQuestionsBulk(request: { sessionCode: string; questions: any[] }): Observable<{ questions: Question[] }> {
    return this.http.post<{ questions: Question[] }>(`${this.apiUrl}/api/questions/bulk`, request);
  }

  // Answer management
  submitAnswer(request: SubmitAnswerRequest): Observable<{ answer: Answer }> {
    return this.http.post<{ answer: Answer }>(`${this.apiUrl}/api/answers`, request);
  }

  getAnswersForQuestion(questionId: string): Observable<{ answers: Answer[] }> {
    return this.http.get<{ answers: Answer[] }>(`${this.apiUrl}/api/answers/question/${questionId}`);
  }

  getAnswersForTeam(teamId: string): Observable<{ answers: Answer[] }> {
    return this.http.get<{ answers: Answer[] }>(`${this.apiUrl}/api/answers/team/${teamId}`);
  }

  scoreAnswer(id: string, request: ScoreAnswerRequest): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/api/answers/${id}/score`, request);
  }

  getAnswer(id: string): Observable<{ answer: Answer }> {
    return this.http.get<{ answer: Answer }>(`${this.apiUrl}/api/answers/${id}`);
  }

  deleteAnswer(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/api/answers/${id}`);
  }
}
