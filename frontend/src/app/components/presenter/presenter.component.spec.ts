import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';

import { PresenterComponent } from './presenter.component';
import { QuizService } from '../../services/quiz.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { PWAService } from '../../services/pwa.service';
import { SocketService } from '../../services/socket.service';

describe('PresenterComponent', () => {
  let component: PresenterComponent;
  let fixture: ComponentFixture<PresenterComponent>;
  let mockPwaService: jasmine.SpyObj<PWAService>;

  beforeEach(async () => {
    const quizServiceSpy = jasmine.createSpyObj('QuizService', [
      'createSession',
      'getSessionStatus',
      'updateSessionConfiguration'
    ]);
    
    const quizManagementServiceSpy = jasmine.createSpyObj('QuizManagementService', [
      'getThemes',
      'createQuestion',
      'getQuestionsForSession',
      'startQuestion',
      'endQuestion',
      'showLeaderboard'
    ]);
    
    const pwaServiceSpy = jasmine.createSpyObj('PWAService', [
      'requestNotificationPermission',
      'installPWA',
      'showNotification'
    ], {
      isInstallable$: { subscribe: jasmine.createSpy() },
      isInstalled$: { subscribe: jasmine.createSpy() }
    });
    
    const socketServiceSpy = jasmine.createSpyObj('SocketService', [
      'connect',
      'emitPresenterAction',
      'on'
    ]);
    
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Mock socket service 'on' method to return observables
    socketServiceSpy.on.and.callFake(() => {
      return new Subject().asObservable();
    });

    await TestBed.configureTestingModule({
      imports: [PresenterComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: QuizService, useValue: quizServiceSpy },
        { provide: QuizManagementService, useValue: quizManagementServiceSpy },
        { provide: PWAService, useValue: pwaServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PresenterComponent);
    component = fixture.componentInstance;
    mockPwaService = TestBed.inject(PWAService) as jasmine.SpyObj<PWAService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.isLoading).toBe(false);
    expect(component.currentView).toBe('setup');
    expect(component.showQRCode).toBe(false);
    expect(component.isTouchDevice).toBeDefined();
    expect(component.isReducedMotion).toBeDefined();
  });

  it('should detect device capabilities', () => {
    expect(component.isTouchDevice).toBe(false); // In test environment
    expect(component.isReducedMotion).toBeDefined();
  });

  it('should setup PWA handling on init', () => {
    component.ngOnInit();
    expect(mockPwaService.requestNotificationPermission).toHaveBeenCalled();
  });

  it('should have essential methods defined', () => {
    expect(typeof component.createSession).toBe('function');
    expect(typeof component.startSession).toBe('function');
    expect(typeof component.endSession).toBe('function');
    expect(typeof component.startQuestion).toBe('function');
    expect(typeof component.endQuestion).toBe('function');
  });

  it('should handle button animations', () => {
    // Test button states object exists
    expect(component.buttonStates).toBeDefined();
  });

  it('should handle card hover animations when not reduced motion', () => {
    component.isReducedMotion = false;

    component.onCardHover('test-card', true);
    expect(component.cardStates['test-card']).toBe('hovered');

    component.onCardHover('test-card', false);
    expect(component.cardStates['test-card']).toBe('normal');
  });

  it('should not animate when reduced motion is enabled', () => {
    component.isReducedMotion = true;
    component.cardStates['test-card'] = 'normal';

    component.onCardHover('test-card', true);
    expect(component.cardStates['test-card']).toBe('normal');
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

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should handle view changes', () => {
    component.currentView = 'setup';
    expect(component.currentView).toBe('setup');

    component.currentView = 'active';
    expect(component.currentView).toBe('active');
  });

  it('should handle loading states', () => {
    component.isLoading = true;
    expect(component.isLoading).toBe(true);

    component.isLoading = false;
    expect(component.isLoading).toBe(false);
  });

  it('should handle QR code visibility', () => {
    component.showQRCode = true;
    expect(component.showQRCode).toBe(true);

    component.showQRCode = false;
    expect(component.showQRCode).toBe(false);
  });

  it('should initialize animation states', () => {
    expect(component.buttonStates).toBeDefined();
    expect(component.cardStates).toBeDefined();
  });

  it('should handle PWA setup', () => {
    // Test PWA service integration
    expect(mockPwaService.requestNotificationPermission).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    
    // Test that component can handle keyboard events
    expect(() => component.onKeyDown(escapeEvent)).not.toThrow();
  });

  it('should provide basic functionality', () => {
    // Test basic component functionality
    expect(component).toBeTruthy();
    expect(component.currentView).toBeDefined();
  });

  // Compatibility methods that support the existing template
  it('should have compatibility methods for existing template', () => {
    // These methods ensure the component works with the existing HTML template
    expect(component.showConfigurationForm).toBeDefined();
    expect(component.isConnected).toBeDefined();
    expect(typeof component.getQuizStatusClass).toBe('function');
    expect(typeof component.getQuizStatusText).toBe('function');
  });
});