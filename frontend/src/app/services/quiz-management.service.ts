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
    return this.http.post<{ question: Question }>(`${this.apiUrl}/api/questions`, request);
  }

  getQuestionsForSession(sessionCode: string, round?: number): Observable<{ questions: Question[] }> {
    let params: Record<string, string> = {};
    if (round !== undefined) {
      params = { round: round.toString() };
    }
    return this.http.get<{ questions: Question[] }>(`${this.apiUrl}/api/questions/session/${sessionCode}`, { params });
  }

  deleteQuestion(questionId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/api/questions/${questionId}`);
  }

  // Quiz Flow Management
  startQuestion(sessionCode: string, questionId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/api/quiz/${sessionCode}/start-question`, { questionId });
  }

  endQuestion(sessionCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/api/quiz/${sessionCode}/end-question`, {});
  }

  showReview(sessionCode: string, questionId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/api/quiz/${sessionCode}/show-review`, { questionId });
  }

  showLeaderboard(sessionCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/api/quiz/${sessionCode}/show-leaderboard`, {});
  }

  nextRound(sessionCode: string): Observable<{ success: boolean; currentRound?: number }> {
    return this.http.post<{ success: boolean; currentRound?: number }>(`${this.apiUrl}/api/quiz/${sessionCode}/next-round`, {});
  }

  endSession(sessionCode: string): Observable<{ success: boolean; teams?: unknown[] }> {
    return this.http.post<{ success: boolean; teams?: unknown[] }>(`${this.apiUrl}/api/quiz/${sessionCode}/end`, {});
  }

  // Answer Management
  getAnswersForQuestion(questionId: string): Observable<{ answers: unknown[] }> {
    return this.http.get<{ answers: unknown[] }>(`${this.apiUrl}/api/answers/question/${questionId}`);
  }

  scoreAnswer(answerId: string, points: number, isCorrect?: boolean): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/api/answers/${answerId}/score`, { 
      points, 
      isCorrect 
    });
  }

  // Team Management
  getTeamsForSession(sessionCode: string): Observable<{ teams: unknown[] }> {
    return this.http.get<{ teams: unknown[] }>(`${this.apiUrl}/api/teams/session/${sessionCode}`);
  }

  // Theme and Session Configuration Methods
  getAvailableThemes(): Observable<{ themes: Theme[] }> {
    return this.http.get<{ themes: Theme[] }>(`${this.apiUrl}/api/session-config/themes`);
  }

  getThemeQuestionCounts(themeId: string): Observable<{ questionCounts: Record<string, number> }> {
    return this.http.get<{ questionCounts: Record<string, number> }>(`${this.apiUrl}/api/session-config/themes/${themeId}/question-counts`);
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
    return this.http.post<{ configuration: SessionConfiguration }>(`${this.apiUrl}/api/session-config/configure`, config);
  }

  getSessionConfiguration(sessionCode: string): Observable<{ configuration: SessionConfiguration }> {
    return this.http.get<{ configuration: SessionConfiguration }>(`${this.apiUrl}/api/session-config/${sessionCode}`);
  }

  generateQuestionsForRound(sessionCode: string, roundNumber: number): Observable<{ questions: Question[] }> {
    return this.http.post<{ questions: Question[] }>(`${this.apiUrl}/api/session-config/${sessionCode}/generate-questions/${roundNumber}`, {});
  }
}
