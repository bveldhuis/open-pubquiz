import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QuizSession } from '../models/quiz-session.model';
import { Question } from '../models/question.model';
import { Team } from '../models/team.model';
import { Answer } from '../models/answer.model';
import { CreateSessionRequest } from '../models/create-session-request.model';
import { JoinSessionRequest } from '../models/join-session-request.model';
import { SubmitAnswerRequest } from '../models/submit-answer-request.model';
import { ScoreAnswerRequest } from '../models/score-answer-request.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Session management
  createSession(request: CreateSessionRequest): Observable<{ session: QuizSession }> {
    return this.http.post<{ session: QuizSession }>(`${this.apiUrl}/quiz`, request);
  }

  getSession(code: string): Observable<{ session: QuizSession }> {
    return this.http.get<{ session: QuizSession }>(`${this.apiUrl}/quiz/${code}`);
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
    }>(`${this.apiUrl}/quiz/${code}/status`);
  }

  updateSessionStatus(code: string, status: string): Observable<{ success: boolean; status: string }> {
    return this.http.patch<{ success: boolean; status: string }>(`${this.apiUrl}/quiz/${code}/status`, { status });
  }

  endSession(code: string): Observable<{ success: boolean; teams?: unknown[] }> {
    return this.http.post<{ success: boolean; teams?: unknown[] }>(`${this.apiUrl}/quiz/${code}/end`, {});
  }

  getLeaderboard(code: string): Observable<{ teams: Team[] }> {
    return this.http.get<{ teams: Team[] }>(`${this.apiUrl}/quiz/${code}/leaderboard`);
  }

  getSessionEvents(code: string): Observable<{ events: unknown[] }> {
    return this.http.get<{ events: unknown[] }>(`${this.apiUrl}/quiz/${code}/events`);
  }

  // Team management
  joinSession(request: JoinSessionRequest): Observable<{ team: Team }> {
    return this.http.post<{ team: Team }>(`${this.apiUrl}/teams/join`, request);
  }

  getTeam(id: string): Observable<{ team: Team }> {
    return this.http.get<{ team: Team }>(`${this.apiUrl}/teams/${id}`);
  }

  updateTeamPoints(id: string, points: number): Observable<{ success: boolean; totalPoints: number }> {
    return this.http.patch<{ success: boolean; totalPoints: number }>(`${this.apiUrl}/teams/${id}/points`, { points });
  }

  getTeamsForSession(sessionCode: string): Observable<{ teams: Team[] }> {
    return this.http.get<{ teams: Team[] }>(`${this.apiUrl}/teams/session/${sessionCode}`);
  }

  removeTeam(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/teams/${id}`);
  }

  updateTeamActivity(id: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/teams/${id}/activity`, {});
  }

  // Question management
  createQuestion(request: unknown): Observable<{ question: Question }> {
    return this.http.post<{ question: Question }>(`${this.apiUrl}/questions`, request);
  }

  getQuestionsForSession(sessionCode: string, round?: number): Observable<{ questions: Question[] }> {
    let params: Record<string, string> = {};
    if (round !== undefined) {
      params = { round: round.toString() };
    }
    return this.http.get<{ questions: Question[] }>(`${this.apiUrl}/questions/session/${sessionCode}`, { params });
  }

  getQuestion(id: string): Observable<{ question: Question }> {
    return this.http.get<{ question: Question }>(`${this.apiUrl}/questions/${id}`);
  }

  updateQuestion(id: string, request: unknown): Observable<{ question: Question }> {
    return this.http.put<{ question: Question }>(`${this.apiUrl}/questions/${id}`, request);
  }

  deleteQuestion(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/questions/${id}`);
  }

  createQuestionsBulk(request: { sessionCode: string; questions: unknown[] }): Observable<{ questions: Question[] }> {
    return this.http.post<{ questions: Question[] }>(`${this.apiUrl}/questions/bulk`, request);
  }

  // Answer management
  submitAnswer(request: SubmitAnswerRequest): Observable<{ answer: Answer }> {
    return this.http.post<{ answer: Answer }>(`${this.apiUrl}/answers`, request);
  }

  getAnswersForQuestion(questionId: string): Observable<{ answers: Answer[] }> {
    return this.http.get<{ answers: Answer[] }>(`${this.apiUrl}/answers/question/${questionId}`);
  }

  getAnswersForTeam(teamId: string): Observable<{ answers: Answer[] }> {
    return this.http.get<{ answers: Answer[] }>(`${this.apiUrl}/answers/team/${teamId}`);
  }

  scoreAnswer(id: string, request: ScoreAnswerRequest): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/answers/${id}/score`, request);
  }

  getAnswer(id: string): Observable<{ answer: Answer }> {
    return this.http.get<{ answer: Answer }>(`${this.apiUrl}/answers/${id}`);
  }

  deleteAnswer(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/answers/${id}`);
  }
}
