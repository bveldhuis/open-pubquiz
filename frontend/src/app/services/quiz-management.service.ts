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

export interface SampleQuestion {
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
          type: 'true_false' as const,
          question_text: 'The Great Wall of China is visible from space with the naked eye.',
          fun_fact: 'This is actually false! The Great Wall is not visible from space without aid, contrary to popular belief.',
          time_limit: 20,
          points: 1,
          correct_answer: 'false'
        },
        {
          round_number: 1,
          question_number: 2,
          type: 'numerical' as const,
          question_text: 'What is the value of π (pi) to 2 decimal places?',
          fun_fact: 'π is an irrational number, meaning it has infinite decimal places with no repeating pattern.',
          time_limit: 30,
          points: 2,
          numerical_answer: 3.14,
          numerical_tolerance: 0.01
        },
        {
          round_number: 1,
          question_number: 3,
          type: 'image' as const,
          question_text: 'What landmark is shown in this image?',
          fun_fact: 'This iconic tower was built for the 1889 World\'s Fair in Paris and stands 330 meters tall.',
          time_limit: 45,
          points: 2,
          media_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500&h=400&fit=crop',
          correct_answer: 'Eiffel Tower'
        },
        {
          round_number: 1,
          question_number: 4,
          type: 'audio' as const,
          question_text: 'Name the composer of this famous classical piece.',
          fun_fact: 'This piece is "Eine kleine Nachtmusik" composed in 1787, one of Mozart\'s most recognizable works.',
          time_limit: 60,
          points: 3,
          media_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
          correct_answer: 'Mozart'
        },
        {
          round_number: 1,
          question_number: 5,
          type: 'video' as const,
          question_text: 'In which city does this famous scene take place?',
          fun_fact: 'This location has been featured in countless movies and is one of the most filmed places in the world.',
          time_limit: 45,
          points: 2,
          media_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          correct_answer: 'New York'
        }
      ],
      2: [
        {
          round_number: 2,
          question_number: 1,
          type: 'multiple_choice' as const,
          question_text: 'What is the chemical symbol for gold?',
          fun_fact: 'Gold is one of the least reactive chemical elements and has been used as currency throughout human history.',
          time_limit: 30,
          points: 1,
          options: ['Ag', 'Au', 'Fe', 'Cu'],
          correct_answer: 'Au'
        },
        {
          round_number: 2,
          question_number: 2,
          type: 'open_text' as const,
          question_text: 'What is the largest organ in the human body?',
          fun_fact: 'The skin is not only the largest organ but also the heaviest, weighing about 8-10 pounds in adults.',
          time_limit: 45,
          points: 2,
          correct_answer: 'Skin'
        },
        {
          round_number: 2,
          question_number: 3,
          type: 'sequence' as const,
          question_text: 'Order these elements by atomic number (lowest to highest):',
          fun_fact: 'The periodic table organizes elements by their atomic number, which represents the number of protons in the nucleus.',
          time_limit: 60,
          points: 3,
          sequence_items: ['Hydrogen (1)', 'Carbon (6)', 'Oxygen (8)', 'Sodium (11)', 'Iron (26)', 'Gold (79)']
        }
      ],
      3: [
        {
          round_number: 3,
          question_number: 1,
          type: 'multiple_choice' as const,
          question_text: 'Who played Iron Man in the Marvel Cinematic Universe?',
          fun_fact: 'Robert Downey Jr. was initially considered a risky choice for the role due to his past legal issues.',
          time_limit: 30,
          points: 1,
          options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
          correct_answer: 'Robert Downey Jr.'
        },
        {
          round_number: 3,
          question_number: 2,
          type: 'open_text' as const,
          question_text: 'What is the name of the fictional town where The Simpsons live?',
          fun_fact: 'Springfield was chosen because it\'s a common town name in the United States, with over 30 states having a Springfield.',
          time_limit: 45,
          points: 2,
          correct_answer: 'Springfield'
        },
        {
          round_number: 3,
          question_number: 3,
          type: 'sequence' as const,
          question_text: 'Put these Star Wars movies in chronological order (story timeline):',
          fun_fact: 'The Star Wars saga spans over 60 years of in-universe history, from the prequel trilogy to the sequel trilogy.',
          time_limit: 60,
          points: 3,
          sequence_items: ['Episode I: The Phantom Menace', 'Episode II: Attack of the Clones', 'Episode III: Revenge of the Sith', 'Episode IV: A New Hope', 'Episode V: The Empire Strikes Back', 'Episode VI: Return of the Jedi']
        }
      ],
      4: [
        {
          round_number: 4,
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
          round_number: 4,
          question_number: 2,
          type: 'open_text' as const,
          question_text: 'What year did World War II end?',
          fun_fact: 'The war ended with the surrender of Germany in May 1945 and Japan in September 1945.',
          time_limit: 45,
          points: 2,
          correct_answer: '1945'
        },
        {
          round_number: 4,
          question_number: 3,
          type: 'sequence' as const,
          question_text: 'Put these planets in order from closest to farthest from the Sun:',
          fun_fact: 'The solar system contains 8 planets, with Pluto being reclassified as a dwarf planet in 2006.',
          time_limit: 60,
          points: 3,
          sequence_items: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
        }
      ],
      5: [
        {
          round_number: 5,
          question_number: 1,
          type: 'numerical' as const,
          question_text: 'What is the speed of light in vacuum? (Answer in km/s)',
          fun_fact: 'The speed of light in a vacuum is exactly 299,792.458 km/s, one of the fundamental constants of physics.',
          time_limit: 45,
          points: 3,
          numerical_answer: 299792.458,
          numerical_tolerance: 1000
        },
        {
          round_number: 5,
          question_number: 2,
          type: 'true_false' as const,
          question_text: 'Bananas are berries, but strawberries are not.',
          fun_fact: 'Botanically speaking, berries must have seeds inside their flesh. Bananas qualify, but strawberries have seeds on the outside!',
          time_limit: 25,
          points: 2,
          correct_answer: 'true'
        },
        {
          round_number: 5,
          question_number: 3,
          type: 'multiple_choice' as const,
          question_text: 'Which programming language was originally called "Oak"?',
          fun_fact: 'Java was initially called Oak but had to be renamed due to trademark issues with Oak Technology.',
          time_limit: 30,
          points: 2,
          options: ['Python', 'Java', 'C++', 'JavaScript'],
          correct_answer: 'Java'
        }
      ]
    };

    return samples[roundNumber as keyof typeof samples] || [];
  }
}
