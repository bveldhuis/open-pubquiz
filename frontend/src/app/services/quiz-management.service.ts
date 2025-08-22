import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

export interface Theme {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoundConfiguration {
  roundNumber: number;
  themeId: string;
  themeName: string;
  questionTypes: {
    type: string;
    enabled: boolean;
    questionCount: number;
    maxAvailable: number;
  }[];
  totalQuestions: number;
}

export interface SessionConfiguration {
  id: string;
  quiz_session_id: string;
  total_rounds: number;
  round_configurations: RoundConfiguration[];
  created_at: string;
  updated_at: string;
}



export interface CreateQuestionRequest {
  sessionCode: string;
  roundNumber: number;
  questionNumber: number;
  type: 'multiple_choice' | 'open_text' | 'sequence' | 'true_false' | 'numerical' | 'image' | 'audio' | 'video';
  questionText: string;
  funFact?: string;
  timeLimit?: number;
  points?: number;
  options?: string[];
  correctAnswer?: string;
  sequenceItems?: string[];
  mediaUrl?: string;
  numericalAnswer?: number;
  numericalTolerance?: number;
}



export interface QuizState {
  currentQuestion?: Question;
  timeRemaining?: number;
  isActive: boolean;
  submissionsReceived: number;
  totalTeams: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuizManagementService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Question Management
  createQuestion(request: CreateQuestionRequest): Observable<{ question: Question }> {
    return this.http.post<{ question: Question }>(`${this.apiUrl}/api/questions`, request);
  }

  getQuestionsForSession(sessionCode: string, round?: number): Observable<{ questions: Question[] }> {
    let params: any = {};
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

  endSession(sessionCode: string): Observable<{ success: boolean; teams?: any[] }> {
    return this.http.post<{ success: boolean; teams?: any[] }>(`${this.apiUrl}/api/quiz/${sessionCode}/end`, {});
  }

  // Answer Management
  getAnswersForQuestion(questionId: string): Observable<{ answers: any[] }> {
    return this.http.get<{ answers: any[] }>(`${this.apiUrl}/api/answers/question/${questionId}`);
  }

  scoreAnswer(answerId: string, points: number, isCorrect?: boolean): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/api/answers/${answerId}/score`, { 
      points, 
      isCorrect 
    });
  }

  // Team Management
  getTeamsForSession(sessionCode: string): Observable<{ teams: any[] }> {
    return this.http.get<{ teams: any[] }>(`${this.apiUrl}/api/teams/session/${sessionCode}`);
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
