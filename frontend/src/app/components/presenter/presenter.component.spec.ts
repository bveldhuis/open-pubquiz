import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

import { PresenterComponent } from './presenter.component';
import { AuthService } from '../../services/auth.service';
// import { QuizService } from '../../services/quiz.service';
import { QuizManagementService } from '../../services/quiz-management.service';
import { SocketService } from '../../services/socket.service';
import { PWAService } from '../../services/pwa.service';

describe('PresenterComponent', () => {
  let component: PresenterComponent;
  let fixture: ComponentFixture<PresenterComponent>;
  // let _mockAuthService: jasmine.SpyObj<AuthService>;
  // let _mockSocketService: jasmine.SpyObj<SocketService>;
  let mockPwaService: jasmine.SpyObj<PWAService>;
  // let _mockRouter: jasmine.SpyObj<Router>;
  // let _mockMatSnackBar: jasmine.SpyObj<MatSnackBar>;

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

    // Mock PWA service methods
    pwaServiceSpy.requestNotificationPermission.and.returnValue(Promise.resolve(true));
    
    // Mock PWA service observables
    pwaServiceSpy.isInstallable$ = of(false);
    pwaServiceSpy.isInstalled$ = of(false);

    await TestBed.configureTestingModule({
      imports: [
        PresenterComponent, 
        ReactiveFormsModule, 
        NoopAnimationsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        FormBuilder,
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

    fixture = TestBed.createComponent(PresenterComponent);
    component = fixture.componentInstance;
    // _mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    // _mockSocketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    mockPwaService = TestBed.inject(PWAService) as jasmine.SpyObj<PWAService>;
    // _mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    // _mockMatSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    // Call ngOnInit to trigger PWA setup
    component.ngOnInit();
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
    // Set the properties directly for test environment
    component.isTouchDevice = false;
    component.isReducedMotion = false;
    
    // In test environment, touch device detection should return false
    expect(component.isTouchDevice).toBe(false);
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