import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { UserSession } from '../models/user-session.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    let store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.callFake((key: string) => store[key] || null),
      setItem: jasmine.createSpy('setItem').and.callFake((key: string, value: string) => store[key] = value),
      removeItem: jasmine.createSpy('removeItem').and.callFake((key: string) => delete store[key]),
      clear: jasmine.createSpy('clear').and.callFake(() => store = {}),
      length: 0,
      key: jasmine.createSpy('key').and.returnValue(null)
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    // Clear localStorage after each test
    mockLocalStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no user session', () => {
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should load user session from localStorage on init', () => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    // Set up localStorage before creating service
    mockLocalStorage.setItem('userSession', JSON.stringify(mockSession));
    
    // Clear the existing service and create a new one
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    
    const newService = TestBed.inject(AuthService);
    
    expect(newService.getCurrentUser()).toEqual(mockSession);
    expect(newService.isLoggedIn()).toBeTrue();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    // Set corrupted data in localStorage
    mockLocalStorage.setItem('userSession', 'invalid-json');
    spyOn(console, 'error');
    
    // Clear the existing service and create a new one
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    
    const newService = TestBed.inject(AuthService);
    
    expect(newService.getCurrentUser()).toBeNull();
    expect(console.error).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userSession');
  });

  it('should set user session correctly', () => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    service.setUserSession(mockSession);

    expect(service.getCurrentUser()).toEqual(mockSession);
    expect(service.isLoggedIn()).toBeTrue();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userSession', JSON.stringify(mockSession));
  });

  it('should clear user session correctly', () => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    service.setUserSession(mockSession);
    expect(service.isLoggedIn()).toBeTrue();

    service.clearUserSession();

    expect(service.getCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('userSession');
  });

  it('should return correct team information', () => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    service.setUserSession(mockSession);

    expect(service.getTeamId()).toBe('team1');
    expect(service.getTeamName()).toBe('Test Team');
    expect(service.getSessionCode()).toBe('TEST123');
  });

  it('should return null for team information when not logged in', () => {
    expect(service.getTeamId()).toBeNull();
    expect(service.getTeamName()).toBeNull();
    expect(service.getSessionCode()).toBeNull();
  });

  it('should join session successfully', async () => {
    // Mock the HTTP response
    const mockResponse = {
      team: {
        id: 'team_123',
        name: 'Test Team',
        totalPoints: 0,
        joinedAt: new Date().toISOString()
      }
    };
    
    const httpMock = TestBed.inject(HttpTestingController);
    
    // Start the service call first
    const resultPromise = service.joinSession('TEST123', 'Test Team');
    
    // Then expect and flush the HTTP request
    const req = httpMock.expectOne(`${environment.apiUrl}/teams/join`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sessionCode: 'TEST123', teamName: 'Test Team' });
    req.flush(mockResponse);

    const result = await resultPromise;

    expect(result.success).toBeTrue();
    expect(result.error).toBeUndefined();
    
    const currentUser = service.getCurrentUser();
    expect(currentUser).toBeTruthy();
    expect(currentUser?.teamName).toBe('Test Team');
    expect(currentUser?.sessionCode).toBe('TEST123');
    expect(currentUser?.teamId).toBe('team_123');
  });

  it('should emit user changes through observable', (done) => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    let emissionCount = 0;
    service.currentUser$.subscribe(user => {
      if (emissionCount === 0) {
        expect(user).toBeNull(); // Initial value
        emissionCount++;
      } else {
        expect(user).toEqual(mockSession);
        done();
      }
    });

    service.setUserSession(mockSession);
  });

  it('should provide getCurrentSession alias method', () => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    service.setUserSession(mockSession);

    expect(service.getCurrentSession()).toEqual(mockSession);
  });

  it('should provide clearSession alias method', () => {
    const mockSession: UserSession = {
      teamId: 'team1',
      teamName: 'Test Team',
      sessionCode: 'TEST123'
    };

    service.setUserSession(mockSession);
    expect(service.isLoggedIn()).toBeTrue();

    service.clearSession();

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getCurrentSession()).toBeNull();
  });

  it('should handle edge cases in joinSession', async () => {
    const httpMock = TestBed.inject(HttpTestingController);
    
    // Test with empty session code
    const mockResponse1 = {
      team: {
        id: 'team_456',
        name: 'Test Team',
        totalPoints: 0,
        joinedAt: new Date().toISOString()
      }
    };
    
    const result1Promise = service.joinSession('', 'Test Team');
    const req1 = httpMock.expectOne(`${environment.apiUrl}/teams/join`);
    req1.flush(mockResponse1);
    const result1 = await result1Promise;
    expect(result1.success).toBeTrue();

    // Test with empty team name
    const mockResponse2 = {
      team: {
        id: 'team_789',
        name: '',
        totalPoints: 0,
        joinedAt: new Date().toISOString()
      }
    };
    
    const result2Promise = service.joinSession('TEST123', '');
    const req2 = httpMock.expectOne(`${environment.apiUrl}/teams/join`);
    req2.flush(mockResponse2);
    const result2 = await result2Promise;
    expect(result2.success).toBeTrue();
  });
});