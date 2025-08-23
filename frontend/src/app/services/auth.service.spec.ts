import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { UserSession } from '../models/user-session.model';

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
    
    // Create new service instance to trigger constructor
    const newService = new AuthService();
    
    expect(newService.getCurrentUser()).toEqual(mockSession);
    expect(newService.isLoggedIn()).toBeTrue();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    // Set corrupted data in localStorage
    mockLocalStorage.setItem('userSession', 'invalid-json');
    spyOn(console, 'error');
    
    // Create new service instance to trigger constructor
    const newService = new AuthService();
    
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
    const result = await service.joinSession('TEST123', 'Test Team');

    expect(result.success).toBeTrue();
    expect(result.error).toBeUndefined();
    
    const currentUser = service.getCurrentUser();
    expect(currentUser).toBeTruthy();
    expect(currentUser?.teamName).toBe('Test Team');
    expect(currentUser?.sessionCode).toBe('TEST123');
    expect(currentUser?.teamId).toMatch(/^team_\d+$/); // Should match generated ID pattern
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
    // Test with empty session code
    const result1 = await service.joinSession('', 'Test Team');
    expect(result1.success).toBeTrue(); // Current implementation allows empty codes

    // Test with empty team name
    const result2 = await service.joinSession('TEST123', '');
    expect(result2.success).toBeTrue(); // Current implementation allows empty names
  });
});