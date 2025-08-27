import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QuizService } from './quiz.service';
import { environment } from '../../environments/environment';

describe('QuizService', () => {
  let service: QuizService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuizService]
    });
    service = TestBed.inject(QuizService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Methods', () => {
    it('should have createSession method', () => {
      expect(typeof service.createSession).toBe('function');
    });

    it('should have getSessionStatus method', () => {
      expect(typeof service.getSessionStatus).toBe('function');
    });

    it('should have getTeam method', () => {
      expect(typeof service.getTeam).toBe('function');
    });

    it('should have getLeaderboard method', () => {
      expect(typeof service.getLeaderboard).toBe('function');
    });
  });

  describe('HTTP Requests', () => {
    it('should make HTTP request for createSession', () => {
      const mockConfig = { name: 'Test Quiz' };
      const mockResponse = { success: true };

      service.createSession(mockConfig).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should make HTTP request for getSessionStatus', () => {
      const sessionCode = 'TEST123';
      const mockResponse = { status: 'active', currentRound: 1, teamCount: 5 };

      service.getSessionStatus(sessionCode).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should make HTTP request for getLeaderboard', () => {
      const sessionCode = 'TEST123';
      const mockResponse = { teams: [] };

      service.getLeaderboard(sessionCode).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/leaderboard`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', () => {
      const sessionCode = 'INVALID';

      service.getSessionStatus(sessionCode).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/quiz/${sessionCode}/status`);
      req.flush('Session not found', { status: 404, statusText: 'Not Found' });
    });
  });
});