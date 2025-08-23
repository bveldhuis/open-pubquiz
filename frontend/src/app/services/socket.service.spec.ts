import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';

// Mock Socket.IO
const mockSocket = {
  connect: jasmine.createSpy('connect'),
  disconnect: jasmine.createSpy('disconnect'),
  emit: jasmine.createSpy('emit'),
  on: jasmine.createSpy('on'),
  off: jasmine.createSpy('off'),
  connected: true
};

// Mock io function
const mockIo = jasmine.createSpy('io').and.returnValue(mockSocket);

// Mock socket.io-client (Note: Actual mocking would be done at runtime)

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SocketService]
    });
    
    // Reset mocks
    mockSocket.connect.calls.reset();
    mockSocket.disconnect.calls.reset();
    mockSocket.emit.calls.reset();
    mockSocket.on.calls.reset();
    mockSocket.off.calls.reset();
    mockIo.calls.reset();
    
    service = TestBed.inject(SocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide connection status observable', (done) => {
    service.connectionStatus$.subscribe(status => {
      expect(typeof status).toBe('boolean');
      done();
    });
  });

  it('should provide event observables', () => {
    expect(service.teamJoined$).toBeDefined();
    expect(service.teamJoinedSession$).toBeDefined();
    expect(service.existingTeams$).toBeDefined();
    expect(service.questionStarted$).toBeDefined();
    expect(service.questionEnded$).toBeDefined();
    expect(service.leaderboardUpdated$).toBeDefined();
    expect(service.reviewAnswers$).toBeDefined();
    expect(service.answerReceived$).toBeDefined();
    expect(service.roundStarted$).toBeDefined();
    expect(service.sessionEnded$).toBeDefined();
    expect(service.sessionEndedError$).toBeDefined();
    expect(service.error$).toBeDefined();
  });

  it('should have connect method', () => {
    expect(typeof service.connect).toBe('function');
  });

  it('should have disconnect method', () => {
    expect(typeof service.disconnect).toBe('function');
  });

  it('should have joinSession method', () => {
    expect(typeof service.joinSession).toBe('function');
  });

  it('should have leaveSession method', () => {
    expect(typeof service.leaveSession).toBe('function');
  });

  it('should have submitAnswer method', () => {
    expect(typeof service.submitAnswer).toBe('function');
  });

  it('should have presenterAction method', () => {
    expect(typeof service.presenterAction).toBe('function');
  });

  it('should have on method for event listening', () => {
    expect(typeof service.on).toBe('function');
  });

  it('should return observable from on method', () => {
    const observable = service.on('test-event');
    expect(observable.subscribe).toBeDefined();
  });

  it('should handle service initialization without errors', () => {
    // Test that service can be instantiated without throwing errors
    expect(() => {
      new SocketService();
    }).not.toThrow();
  });

  // Basic method call tests (without full socket.io mocking)
  it('should call connect method without throwing', () => {
    expect(() => service.connect()).not.toThrow();
  });

  it('should call disconnect method without throwing', () => {
    expect(() => service.disconnect()).not.toThrow();
  });

  it('should call joinSession with valid data without throwing', () => {
    const joinData = {
      sessionCode: 'TEST123',
      teamName: 'Test Team'
    };
    
    expect(() => service.joinSession(joinData)).not.toThrow();
  });

  it('should call leaveSession without throwing', () => {
    expect(() => service.leaveSession()).not.toThrow();
  });

  it('should call submitAnswer with valid data without throwing', () => {
    const answerData = {
      sessionCode: 'TEST123',
      teamId: 'team1',
      questionId: 'q1',
      answer: 'test answer'
    };
    
    expect(() => service.submitAnswer(answerData)).not.toThrow();
  });
});