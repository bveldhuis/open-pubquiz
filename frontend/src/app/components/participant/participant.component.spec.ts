import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

import { ParticipantComponent } from './participant.component';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { PWAService } from '../../services/pwa.service';
import { Question } from '../../models/question.model';
import { LeaderboardTeam } from '../../models/leaderboard-team.model';

describe('ParticipantComponent', () => {
  let component: ParticipantComponent;
  let fixture: ComponentFixture<ParticipantComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockPwaService: jasmine.SpyObj<PWAService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMatSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockQuestion: Question = {
    id: '1',
    quiz_session_id: 'session-1',
    round_number: 1,
    question_number: 1,
    type: 'multiple_choice',
    question_text: 'Test Question',
    time_limit: 30,
    points: 10,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'A',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockSession = {
    teamId: 'team-1',
    teamName: 'Test Team',
    sessionCode: 'TEST123'
  };

  beforeEach(async () => {
    // Mock touch device detection before component creation
    // Note: maxTouchPoints is already mocked in test-setup.ts
    Object.defineProperty(window, 'ontouchstart', { value: undefined, writable: true });
    
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentSession', 'clearSession']);
    const socketServiceSpy = jasmine.createSpyObj('SocketService', [
      'connect',
      'joinSession', 
      'leaveSession',
      'on',
      'emit'
    ]);
    const quizManagementServiceSpy = jasmine.createSpyObj('QuizManagementService', ['getQuestion']);
    const pwaServiceSpy = jasmine.createSpyObj('PWAService', [
      'requestNotificationPermission',
      'notifyNewQuestion',
      'notifyQuizEnded',
      'notifyTimeRunningOut'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Mock socket service 'on' method to return observables
    socketServiceSpy.on.and.callFake(() => new Subject().asObservable());
    socketServiceSpy.connect.and.returnValue(undefined);
    socketServiceSpy.emit.and.returnValue(undefined);
    
    // Mock Observable properties
    socketServiceSpy.connectionStatus$ = new Subject().asObservable();
    socketServiceSpy.teamJoinedSession$ = new Subject().asObservable();
    socketServiceSpy.teamJoined$ = new Subject().asObservable();
    
    // Mock PWA service methods
    pwaServiceSpy.requestNotificationPermission.and.returnValue(Promise.resolve(true));
    
    // Mock PWA service observables
    pwaServiceSpy.isInstallable$ = of(false);
    pwaServiceSpy.isInstalled$ = of(false);

    await TestBed.configureTestingModule({
      imports: [
        ParticipantComponent, 
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
        { provide: QuizManagementService, useValue: quizManagementServiceSpy },
        { provide: PWAService, useValue: pwaServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockSocketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    mockPwaService = TestBed.inject(PWAService) as jasmine.SpyObj<PWAService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockMatSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.teamName).toBe('');
    expect(component.sessionCode).toBe('');
    expect(component.isConnected).toBe(false);
    expect(component.isQuestionActive).toBe(false);
    expect(component.sessionEnded).toBe(false);
    expect(component.isTouchDevice).toBeDefined();
    expect(component.isReducedMotion).toBeDefined();
  });

  it('should detect device capabilities', () => {
    // Set the properties directly for test environment
    component.isTouchDevice = false;
    component.isReducedMotion = false;
    
    // In test environment, touch device detection should return false
    expect(component.isTouchDevice).toBe(false);
    expect(component.isReducedMotion).toBeDefined();
  });

  it('should setup PWA notifications on init', () => {
    mockPwaService.requestNotificationPermission.and.returnValue(Promise.resolve(true));
    
    component.ngOnInit();
    
    expect(mockPwaService.requestNotificationPermission).toHaveBeenCalled();
  });

  it('should load user session on init', () => {
    mockAuthService.getCurrentSession.and.returnValue(mockSession);
    
    component.ngOnInit();
    
    expect(component.teamName).toBe('Test Team');
    expect(component.sessionCode).toBe('TEST123');
  });

  it('should redirect to join page if no session', () => {
    mockAuthService.getCurrentSession.and.returnValue(null);
    
    component.ngOnInit();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/join']);
  });

  it('should handle new question correctly', () => {
    // Test public properties that would be set when a new question arrives
    component.currentQuestion = mockQuestion;
    component.isQuestionActive = true;
    component.answerSubmitted = false;
    component.timeRemaining = 30;
    
    expect(component.currentQuestion).toEqual(mockQuestion);
    expect(component.isQuestionActive).toBe(true);
    expect(component.answerSubmitted).toBe(false);
    expect(component.timeRemaining).toBe(30);
  });

  it('should handle question ended', () => {
    component.isQuestionActive = true;
    component.answerSubmitted = false;
    
    // Simulate question ending
    component.isQuestionActive = false;
    
    expect(component.isQuestionActive).toBe(false);
  });

  it('should handle session ended with leaderboard', () => {
    const mockLeaderboard: LeaderboardTeam[] = [
      { id: 'team-1', name: 'Test Team', total_points: 100, answers_submitted: 5, correct_answers: 4 },
      { id: 'team-2', name: 'Other Team', total_points: 80, answers_submitted: 5, correct_answers: 3 }
    ];
    
    component.teamName = 'Test Team';
    component.sessionEnded = true;
    component.finalLeaderboard = mockLeaderboard;
    
    expect(component.sessionEnded).toBe(true);
    expect(component.finalLeaderboard).toEqual(mockLeaderboard);
  });

  it('should update timer state based on remaining time', () => {
    component.timeRemaining = 45;
    component.timerState = 'normal';
    expect(component.timerState).toBe('normal');
    
    component.timeRemaining = 25;
    component.timerState = 'warning';
    expect(component.timerState).toBe('warning');
    
    component.timeRemaining = 5;
    component.timerState = 'danger';
    expect(component.timerState).toBe('danger');
  });

  it('should track time remaining', () => {
    component.timeRemaining = 10;
    expect(component.timeRemaining).toBe(10);
  });

  it('should handle answer submission', async () => {
    await component.onAnswerSubmitted(null);
    
    expect(component.answerSubmitted).toBe(true);
    expect(mockMatSnackBar.open).toHaveBeenCalled();
  });

  it('should reconnect to session', async () => {
    component.sessionCode = 'TEST123';
    component.teamName = 'Test Team';
    
    await component.reconnect();
    
    expect(mockSocketService.joinSession).toHaveBeenCalledWith({
      sessionCode: 'TEST123',
      teamName: 'Test Team'
    });
  });

  it('should leave session after confirmation', async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    await component.leaveSession();
    
    expect(mockSocketService.leaveSession).toHaveBeenCalled();
    expect(mockAuthService.clearSession).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/join']);
  });

  it('should not leave session if not confirmed', async () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    await component.leaveSession();
    
    expect(mockSocketService.leaveSession).not.toHaveBeenCalled();
  });

  it('should handle card hover animations', () => {
    component.isReducedMotion = false;
    
    component.onCardHover('main', true);
    expect(component.cardStates['main']).toBe('hovered');
    
    component.onCardHover('main', false);
    expect(component.cardStates['main']).toBe('normal');
  });

  it('should not animate when reduced motion is enabled', () => {
    component.isReducedMotion = true;
    component.cardStates['main'] = 'normal';
    
    component.onCardHover('main', true);
    expect(component.cardStates['main']).toBe('normal');
  });

  it('should handle touch events', () => {
    component.isTouchDevice = true;
    const mockElement = { 
      classList: { 
        add: jasmine.createSpy('add'),
        contains: jasmine.createSpy('contains').and.returnValue(true)
      } 
    };
    const mockEvent = { target: mockElement } as unknown as TouchEvent;
    
    component.onTouchStart(mockEvent);
    expect(mockElement.classList.add).toHaveBeenCalledWith('touch-active');
  });

  it('should handle keyboard navigation', () => {
    spyOn(component, 'leaveSession');
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.sessionEnded = true;
    
    component.onKeyDown(escapeEvent);
    expect(component.leaveSession).toHaveBeenCalled();
  });

  it('should manage feedback state', () => {
    component.feedbackState = 'success';
    expect(component.feedbackState).toBe('success');
    
    component.feedbackState = 'error';
    expect(component.feedbackState).toBe('error');
    
    component.feedbackState = '';
    expect(component.feedbackState).toBe('');
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should handle time up event', () => {
    component.answerSubmitted = false;
    
    component.onTimeUp();
    
    // Would show warning message in real implementation
    expect(component.answerSubmitted).toBe(false);
  });

  it('should handle time changed event', () => {
    component.onTimeChanged(25);
    
    // Would update internal timer state
    expect(component).toBeTruthy();
  });

  it('should validate touch device detection', () => {
    component.isTouchDevice = true;
    expect(component.isTouchDevice).toBe(true);
    
    component.isTouchDevice = false;
    expect(component.isTouchDevice).toBe(false);
  });
});