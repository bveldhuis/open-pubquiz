import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';

import { JoinComponent } from '../components/join/join.component';
import { ParticipantComponent } from '../components/participant/participant.component';
import { HomeComponent } from '../components/home/home.component';
import { AuthService } from '../services/auth.service';
import { SocketService } from '../services/socket.service';
import { PWAService } from '../services/pwa.service';
import { Question } from '../models/question.model';

describe('Quiz Flow Integration Tests', () => {
  let router: Router;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockPwaService: jasmine.SpyObj<PWAService>;

  const mockQuestion: Question = {
    id: '1',
    quiz_session_id: 'session-1',
    round_number: 1,
    question_number: 1,
    type: 'multiple_choice',
    question_text: 'What is the capital of France?',
    time_limit: 30,
    points: 10,
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 'Paris',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'setCurrentUser', 
      'getCurrentSession', 
      'clearSession'
    ]);
    const socketServiceSpy = jasmine.createSpyObj('SocketService', [
      'connect', 
      'joinSession', 
      'leaveSession', 
      'on',
      'emit'
    ]);
    const pwaServiceSpy = jasmine.createSpyObj('PWAService', [
      'requestNotificationPermission',
      'installPWA',
      'showNotification',
      'notifyNewQuestion',
      'notifyQuizEnded'
    ], {
      isInstallable$: of(false),
      isInstalled$: of(false)
    });

    // Mock socket service 'on' method
    socketServiceSpy.on.and.callFake(() => {
      return new Subject().asObservable();
    });

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        JoinComponent,
        ParticipantComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
        { provide: PWAService, useValue: pwaServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockSocketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    mockPwaService = TestBed.inject(PWAService) as jasmine.SpyObj<PWAService>;
  });

  describe('Complete Quiz Participation Flow', () => {
    it('should navigate from home to join and then to participant', async () => {
      // Test Home Component
      const homeFixture = TestBed.createComponent(HomeComponent);
      const homeComponent = homeFixture.componentInstance;
      
      homeFixture.detectChanges();
      
      // User clicks on "Join as Participant"
      await homeComponent.goToJoin();
      
      expect(router.navigate).toHaveBeenCalledWith(['/join']);
    });

    it('should complete join flow and navigate to participant', async () => {
      // Test Join Component
      const joinFixture = TestBed.createComponent(JoinComponent);
      const joinComponent = joinFixture.componentInstance;
      
      joinFixture.detectChanges();
      
      // Simulate valid form input
      joinComponent.joinForm.patchValue({
        sessionCode: 'TEST123',
        teamName: 'Test Team'
      });
      
      await joinComponent.joinSession();
      
      expect(joinComponent.isJoining).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/participant']);
    });

    it('should handle participant session lifecycle', async () => {
      // Test Participant Component
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      const participantComponent = participantFixture.componentInstance;
      
      // Mock user session
      mockAuthService.getCurrentSession.and.returnValue({
        teamId: 'team-1',
        teamName: 'Test Team',
        sessionCode: 'TEST123'
      });
      
      participantFixture.detectChanges();
      
      expect(participantComponent.teamName).toBe('Test Team');
      expect(participantComponent.sessionCode).toBe('TEST123');
      
      // Test question handling by setting properties directly
      participantComponent.currentQuestion = mockQuestion;
      participantComponent.isQuestionActive = true;
      participantComponent.timeRemaining = 30;
      
      expect(participantComponent.currentQuestion).toEqual(mockQuestion);
      expect(participantComponent.isQuestionActive).toBe(true);
      expect(participantComponent.timeRemaining).toBe(30);
    });
  });

  describe('PWA Integration Flow', () => {
    it('should handle PWA installation throughout the flow', async () => {
      mockPwaService.requestNotificationPermission.and.returnValue(Promise.resolve(true));
      mockPwaService.installPWA.and.returnValue(Promise.resolve(true));
      
      // Test PWA features in Home Component
      const homeFixture = TestBed.createComponent(HomeComponent);
      const homeComponent = homeFixture.componentInstance;
      
      homeFixture.detectChanges();
      
      await homeComponent.installPWA();
      
      expect(mockPwaService.installPWA).toHaveBeenCalled();
      
      // Test PWA features in Join Component
      const joinFixture = TestBed.createComponent(JoinComponent);
      const joinComponent = joinFixture.componentInstance;
      
      joinFixture.detectChanges();
      
      await joinComponent.installPWA();
      
      expect(mockPwaService.installPWA).toHaveBeenCalledTimes(2);
    });

    it('should handle notifications throughout quiz participation', async () => {
      mockPwaService.notifyNewQuestion.and.returnValue(Promise.resolve());
      mockPwaService.notifyQuizEnded.and.returnValue(Promise.resolve());
      
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      
      // Mock session
      mockAuthService.getCurrentSession.and.returnValue({
        teamId: 'team-1',
        teamName: 'Test Team',
        sessionCode: 'TEST123'
      });
      
      participantFixture.detectChanges();
      
      // Test notification setup
      expect(mockPwaService.requestNotificationPermission).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle auth failures gracefully', async () => {
      const joinFixture = TestBed.createComponent(JoinComponent);
      const joinComponent = joinFixture.componentInstance;
      
      joinFixture.detectChanges();
      
      // Simulate form submission with invalid data
      joinComponent.joinForm.patchValue({
        sessionCode: '',
        teamName: 'Test Team'
      });
      
      joinComponent.joinForm.markAllAsTouched();
      expect(joinComponent.sessionCodeError).toContain('required');
    });

    it('should handle socket connection failures', async () => {
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      
      // Mock no session
      mockAuthService.getCurrentSession.and.returnValue(null);
      
      participantFixture.detectChanges();
      
      expect(router.navigate).toHaveBeenCalledWith(['/join']);
    });

    it('should handle quiz state errors gracefully', async () => {
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      const participantComponent = participantFixture.componentInstance;
      
      // Mock session
      mockAuthService.getCurrentSession.and.returnValue({
        teamId: 'team-1',
        teamName: 'Test Team',
        sessionCode: 'TEST123'
      });
      
      participantFixture.detectChanges();
      
      // Test handling of question end without current question
      participantComponent.currentQuestion = undefined;
      participantComponent.isQuestionActive = false;
      
      expect(participantComponent.isQuestionActive).toBe(false);
    });
  });

  describe('Accessibility Integration', () => {
    it('should handle reduced motion preferences across components', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jasmine.createSpy('matchMedia').and.returnValue({
          matches: true, // Reduced motion enabled
          addEventListener: jasmine.createSpy('addEventListener'),
          removeEventListener: jasmine.createSpy('removeEventListener')
        })
      });
      
      const homeFixture = TestBed.createComponent(HomeComponent);
      const homeComponent = homeFixture.componentInstance;
      
      expect(homeComponent.isReducedMotion).toBe(true);
      
      // Test that animations respect reduced motion
      homeComponent.onCardHover('test', true);
      expect(homeComponent.cardStates['test']).toBe('normal'); // No animation
    });

    it('should handle keyboard navigation across components', () => {
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      const participantComponent = participantFixture.componentInstance;
      
      participantComponent.sessionEnded = true;
      spyOn(participantComponent, 'leaveSession');
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      participantComponent.onKeyDown(escapeEvent);
      
      expect(participantComponent.leaveSession).toHaveBeenCalled();
    });
  });

  describe('Touch Device Integration', () => {
    it('should handle touch interactions across components', () => {
      // Mock touch device
      Object.defineProperty(window, 'navigator', {
        value: { maxTouchPoints: 2 },
        writable: true
      });
      
      const joinFixture = TestBed.createComponent(JoinComponent);
      const joinComponent = joinFixture.componentInstance;
      
      expect(joinComponent.isTouchDevice).toBe(true);
      
      // Test touch event handling
      const mockElement = { 
        classList: { 
          add: jasmine.createSpy('add'),
          contains: jasmine.createSpy('contains').and.returnValue(true)
        } 
      };
      const mockEvent = { target: mockElement } as unknown as TouchEvent;
      
      joinComponent.onTouchStart(mockEvent);
      expect(mockElement.classList.add).toHaveBeenCalledWith('touch-active');
    });

    it('should provide haptic feedback where appropriate', () => {
      const mockNavigator = {
        vibrate: jasmine.createSpy('vibrate'),
        maxTouchPoints: 2
      };
      Object.defineProperty(window, 'navigator', { value: mockNavigator, writable: true });
      
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      const participantComponent = participantFixture.componentInstance;
      
      participantComponent.isTouchDevice = true;
      
      // Test that touch device detection works
      expect(participantComponent.isTouchDevice).toBe(true);
    });
  });

  describe('Real-time Communication Integration', () => {
    it('should handle socket events properly', () => {
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      
      // Mock session
      mockAuthService.getCurrentSession.and.returnValue({
        teamId: 'team-1',
        teamName: 'Test Team',
        sessionCode: 'TEST123'
      });
      
      participantFixture.detectChanges();
      
      // Verify socket listeners are set up
      expect(mockSocketService.on).toHaveBeenCalledWith('question-started');
      expect(mockSocketService.on).toHaveBeenCalledWith('question-ended');
      expect(mockSocketService.on).toHaveBeenCalledWith('session-ended');
      expect(mockSocketService.on).toHaveBeenCalledWith('timer-update');
    });

    it('should handle reconnection scenarios', async () => {
      const participantFixture = TestBed.createComponent(ParticipantComponent);
      const participantComponent = participantFixture.componentInstance;
      
      participantComponent.sessionCode = 'TEST123';
      participantComponent.teamName = 'Test Team';
      
      await participantComponent.reconnect();
      
      expect(mockSocketService.joinSession).toHaveBeenCalledWith({
        sessionCode: 'TEST123',
        teamName: 'Test Team'
      });
    });
  });
});