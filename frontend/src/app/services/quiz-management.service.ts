import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

export interface SampleQuestion {
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
}

export interface CreateQuestionRequest {
  sessionCode: string;
  roundNumber: number;
  questionNumber: number;
  type: 'multiple_choice' | 'open_text' | 'sequence';
  questionText: string;
  funFact?: string;
  timeLimit?: number;
  points?: number;
  options?: string[];
  correctAnswer?: string;
  sequenceItems?: string[];
}

export interface LoadSampleQuestionsRequest {
  sessionCode: string;
  roundNumber: number;
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

  loadSampleQuestions(request: LoadSampleQuestionsRequest): Observable<{ questions: Question[] }> {
    return this.http.post<{ questions: Question[] }>(`${this.apiUrl}/api/questions/sample`, request);
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

  // Sample Questions Data
  getSampleQuestions(roundNumber: number): SampleQuestion[] {
    const samples = {
      1: [
        {
          round_number: 1,
          question_number: 1,
          type: 'multiple_choice' as const,
          question_text: 'What is the capital of France?',
          fun_fact: 'Paris is known as the "City of Light" and has been a major center of art, fashion, and culture for centuries.',
          time_limit: 30,
          points: 1,
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correct_answer: 'Paris'
        },
        {
          round_number: 1,
          question_number: 2,
          type: 'open_text' as const,
          question_text: 'Name the largest planet in our solar system.',
          fun_fact: 'Jupiter is so massive that it could fit all the other planets in our solar system inside it!',
          time_limit: 45,
          points: 2,
          correct_answer: 'Jupiter'
        },
        {
          round_number: 1,
          question_number: 3,
          type: 'sequence' as const,
          question_text: 'Arrange these historical events in chronological order:',
          fun_fact: 'These events shaped the modern world and changed the course of history forever.',
          time_limit: 60,
          points: 3,
          sequence_items: ['World War II ends', 'First moon landing', 'Fall of Berlin Wall', '9/11 attacks'],
          correct_answer: 'World War II ends|First moon landing|Fall of Berlin Wall|9/11 attacks'
        }
      ],
      2: [
        {
          round_number: 2,
          question_number: 1,
          type: 'multiple_choice' as const,
          question_text: 'Which programming language was created by Brendan Eich?',
          fun_fact: 'JavaScript was created in just 10 days in 1995 and was originally called Mocha!',
          time_limit: 30,
          points: 1,
          options: ['Python', 'JavaScript', 'Java', 'C++'],
          correct_answer: 'JavaScript'
        },
        {
          round_number: 2,
          question_number: 2,
          type: 'open_text' as const,
          question_text: 'What is the chemical symbol for gold?',
          fun_fact: 'Gold is one of the few elements that can be found in its native state, meaning it doesn\'t need to be extracted from ore.',
          time_limit: 30,
          points: 1,
          correct_answer: 'Au'
        }
      ]
    };

    return samples[roundNumber as keyof typeof samples] || [];
  }
}
