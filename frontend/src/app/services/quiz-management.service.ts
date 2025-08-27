import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { Theme } from '../models/theme.model';
import { SessionConfiguration } from '../models/session-configuration.model';
import { Question } from '../models/question.model';
import { CreateQuestionRequest } from '../models/create-question-request.model';


@Injectable({
  providedIn: 'root'
})
export class QuizManagementService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Question Management
  createQuestion(request: CreateQuestionRequest): Observable<{ question: Question }> {
    return this.http.post<{ question: Question }>(`${this.apiUrl}/questions`, request);
  }

  getQuestionsForSession(sessionCode: string, round?: number): Observable<{ questions: Question[] }> {
    let params: Record<string, string> = {};
    if (round !== undefined) {
      params = { round: round.toString() };
    }
    return this.http.get<{ questions: Question[] }>(`${this.apiUrl}/questions/session/${sessionCode}`, { params });
  }

  deleteQuestion(questionId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/questions/${questionId}`);
  }

  // Quiz Flow Management
  startQuestion(sessionCode: string, questionId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/quiz/${sessionCode}/start-question`, { questionId });
  }

  endQuestion(sessionCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/quiz/${sessionCode}/end-question`, {});
  }

  showReview(sessionCode: string, questionId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/quiz/${sessionCode}/show-review`, { questionId });
  }

  showLeaderboard(sessionCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/quiz/${sessionCode}/show-leaderboard`, {});
  }

  nextRound(sessionCode: string): Observable<{ success: boolean; currentRound?: number }> {
    return this.http.post<{ success: boolean; currentRound?: number }>(`${this.apiUrl}/quiz/${sessionCode}/next-round`, {});
  }



  endSession(sessionCode: string): Observable<{ success: boolean; teams?: unknown[] }> {
    return this.http.post<{ success: boolean; teams?: unknown[] }>(`${this.apiUrl}/quiz/${sessionCode}/end`, {});
  }

  updateSessionStatus(sessionCode: string, status: string): Observable<{ success: boolean; status: string }> {
    return this.http.patch<{ success: boolean; status: string }>(`${this.apiUrl}/quiz/${sessionCode}/status`, { status });
  }

  // Answer Management
  getAnswersForQuestion(questionId: string): Observable<{ answers: unknown[] }> {
    return this.http.get<{ answers: unknown[] }>(`${this.apiUrl}/answers/question/${questionId}`);
  }

  scoreAnswer(answerId: string, points: number, isCorrect?: boolean): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/answers/${answerId}/score`, { 
      points, 
      isCorrect 
    });
  }

  // Team Management
  getTeamsForSession(sessionCode: string): Observable<{ teams: unknown[] }> {
    return this.http.get<{ teams: unknown[] }>(`${this.apiUrl}/teams/session/${sessionCode}`);
  }

  // Theme and Session Configuration Methods
  getAvailableThemes(): Observable<{ themes: Theme[] }> {
    return this.http.get<{ themes: Theme[] }>(`${this.apiUrl}/session-config/themes`);
  }

  getThemeQuestionCounts(themeId: string): Observable<{ questionCounts: Record<string, number> }> {
    return this.http.get<{ questionCounts: Record<string, number> }>(`${this.apiUrl}/session-config/themes/${themeId}/question-counts`);
  }

  configureSession(config: {
    sessionCode: string;
    totalRounds: number;
    roundConfigurations: {
      roundNumber: number;
      themeId: string;
      questionTypes: {
        type: string;
        enabled: boolean;
        questionCount: number;
      }[];
    }[];
  }): Observable<{ configuration: SessionConfiguration }> {
    return this.http.post<{ configuration: SessionConfiguration }>(`${this.apiUrl}/session-config/configure`, config);
  }

  getSessionConfiguration(sessionCode: string): Observable<{ configuration: SessionConfiguration }> {
    return this.http.get<{ configuration: SessionConfiguration }>(`${this.apiUrl}/session-config/${sessionCode}`);
  }

  generateQuestionsForRound(sessionCode: string, roundNumber: number): Observable<{ questions: Question[] }> {
    return this.http.post<{ questions: Question[] }>(`${this.apiUrl}/session-config/${sessionCode}/generate-questions/${roundNumber}`, {});
  }
}
