import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QuizManagementService } from './quiz-management.service';
import { environment } from '../../environments/environment';

describe('QuizManagementService', () => {
  let service: QuizManagementService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuizManagementService]
    });
    service = TestBed.inject(QuizManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Question Management', () => {
    it('should have createQuestion method', () => {
      expect(typeof service.createQuestion).toBe('function');
    });

    it('should have getQuestionsForSession method', () => {
      expect(typeof service.getQuestionsForSession).toBe('function');
    });

    it('should have deleteQuestion method', () => {
      expect(typeof service.deleteQuestion).toBe('function');
    });

    it('should make HTTP request for createQuestion', () => {
      const mockRequest = {
        sessionCode: 'session1',
        roundNumber: 1,
        questionNumber: 1,
        type: 'multiple_choice' as const,
        questionText: 'Test question?',
        timeLimit: 30,
        points: 10,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A'
      };

      const mockResponse = { success: true };

      service.createQuestion(mockRequest).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/questions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should make HTTP request for getQuestionsForSession', () => {
      const sessionCode = 'TEST123';
      const mockResponse = { questions: [] };

      service.getQuestionsForSession(sessionCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/questions/session/${sessionCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should make HTTP request for getQuestionsForSession with round parameter', () => {
      const sessionCode = 'TEST123';
      const round = 2;
      const mockResponse = { questions: [] };

      service.getQuestionsForSession(sessionCode, round).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/questions/session/${sessionCode}?round=2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should make HTTP request for deleteQuestion', () => {
      const questionId = 'q1';
      const mockResponse = { success: true };

      service.deleteQuestion(questionId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/questions/${questionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('Quiz Flow Management', () => {
    it('should have startQuestion method', () => {
      expect(typeof service.startQuestion).toBe('function');
    });

    it('should have endQuestion method', () => {
      expect(typeof service.endQuestion).toBe('function');
    });

    it('should have showReview method', () => {
      expect(typeof service.showReview).toBe('function');
    });

    it('should have showLeaderboard method', () => {
      expect(typeof service.showLeaderboard).toBe('function');
    });

    it('should make HTTP request for startQuestion', () => {
      const sessionCode = 'TEST123';
      const questionId = 'q1';
      const mockResponse = { success: true };

      service.startQuestion(sessionCode, questionId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/start-question`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ questionId });
      req.flush(mockResponse);
    });

    it('should make HTTP request for endQuestion', () => {
      const sessionCode = 'TEST123';
      const mockResponse = { success: true };

      service.endQuestion(sessionCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/end-question`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should make HTTP request for showReview', () => {
      const sessionCode = 'TEST123';
      const questionId = 'q1';
      const mockResponse = { success: true };

      service.showReview(sessionCode, questionId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/show-review`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ questionId });
      req.flush(mockResponse);
    });

    it('should make HTTP request for showLeaderboard', () => {
      const sessionCode = 'TEST123';
      const mockResponse = { success: true };

      service.showLeaderboard(sessionCode).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/show-leaderboard`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('Session Management', () => {
    it('should have getAvailableThemes method', () => {
      expect(typeof service.getAvailableThemes).toBe('function');
    });

    it('should have configureSession method', () => {
      expect(typeof service.configureSession).toBe('function');
    });

    it('should have getSessionConfiguration method', () => {
      expect(typeof service.getSessionConfiguration).toBe('function');
    });

    it('should make HTTP request for getAvailableThemes', () => {
      const mockResponse = { themes: [] };

      service.getAvailableThemes().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/session-config/themes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', () => {
      const sessionCode = 'TEST123';

      service.getQuestionsForSession(sessionCode).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/questions/session/${sessionCode}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});