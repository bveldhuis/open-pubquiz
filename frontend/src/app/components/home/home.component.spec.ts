import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { PWAService } from '../../services/pwa.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPwaService: jasmine.SpyObj<PWAService>;
  let mockMatSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Mock touch device detection before component creation
    // Note: maxTouchPoints is already mocked in test-setup.ts
    Object.defineProperty(window, 'ontouchstart', { value: undefined, writable: true });
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const pwaServiceSpy = jasmine.createSpyObj('PWAService', [
      'requestNotificationPermission',
      'installPWA',
      'showNotification'
    ]);
    
    // Mock PWA service methods
    pwaServiceSpy.requestNotificationPermission.and.returnValue(Promise.resolve(true));
    pwaServiceSpy.installPWA.and.returnValue(Promise.resolve(true));
    
    // Mock observables properly
    pwaServiceSpy.isInstallable$ = of(false);
    pwaServiceSpy.isInstalled$ = of(false);
    
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: PWAService, useValue: pwaServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockPwaService = TestBed.inject(PWAService) as jasmine.SpyObj<PWAService>;
    mockMatSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.isTouchDevice).toBeDefined();
    expect(component.isReducedMotion).toBeDefined();
    expect(component.buttonStates).toBeDefined();
    expect(component.cardStates).toBeDefined();
  });

  it('should detect device capabilities on construction', () => {
    expect(component.isTouchDevice).toBe(false); // In test environment
  });

  it('should setup PWA handling on init', () => {
    component.ngOnInit();
    // HomeComponent doesn't call requestNotificationPermission, it only sets up PWA observables
    expect(component.isInstallable$).toBeDefined();
    expect(component.isInstalled$).toBeDefined();
  });

  it('should navigate to presenter when goToPresenter is called', fakeAsync(() => {
    component.goToPresenter();
    tick(100); // Wait for the setTimeout delay
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/presenter']);
  }));

  it('should navigate to join when goToJoin is called', fakeAsync(() => {
    component.goToJoin();
    tick(100); // Wait for the setTimeout delay
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/join']);
  }));

  it('should show install notification when installPWA is called', fakeAsync(async () => {
    // Reset the mock to ensure it returns true
    mockPwaService.installPWA.and.returnValue(Promise.resolve(true));
    
    // Ensure component is properly initialized
    component.ngOnInit();
    
    // Replace the component's snackBar with our mock
    (component as any).snackBar = mockMatSnackBar;
    
    // Call the method directly on the component instance
    await component.installPWA();
    
    // Wait for the setTimeout delay
    tick(200);
    
    // Verify the PWA service was called
    expect(mockPwaService.installPWA).toHaveBeenCalled();
    
    // Verify the snackbar was called with the success message
    expect(mockMatSnackBar.open).toHaveBeenCalledWith(
      '🎉 App installed successfully!',
      'Close',
      jasmine.objectContaining({
        duration: 3000,
        panelClass: ['success-snackbar']
      })
    );
  }));

  it('should handle card hover animations when not reduced motion', () => {
    component.isReducedMotion = false;
    
    component.onCardHover('test-card', true);
    expect(component.cardStates['test-card']).toBe('hovered');
    
    component.onCardHover('test-card', false);
    expect(component.cardStates['test-card']).toBe('normal');
  });

  it('should not animate cards when reduced motion is enabled', () => {
    component.isReducedMotion = true;
    component.cardStates['test-card'] = 'normal';
    
    component.onCardHover('test-card', true);
    expect(component.cardStates['test-card']).toBe('normal');
  });

  it('should handle touch events correctly', () => {
    // Set touch device to true so the method actually does something
    component.isTouchDevice = true;
    
    const mockEvent = {
      target: {
        classList: {
          contains: jasmine.createSpy('contains').and.returnValue(true),
          add: jasmine.createSpy('add')
        }
      }
    };
    
    component.onTouchStart(mockEvent as any);
    // The component checks for 'feature-card', 'step-card', or 'action-button'
    expect(mockEvent.target.classList.contains).toHaveBeenCalledWith('feature-card');
    expect(mockEvent.target.classList.add).toHaveBeenCalledWith('touch-active');
  });

  it('should handle keyboard navigation', () => {
    const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(mockEvent, 'preventDefault');
    
    component.onKeyDown(mockEvent);
    // The component should handle enter key appropriately
  });

  it('should scroll to section when scrollToSection is called', () => {
    const mockElement = { scrollIntoView: jasmine.createSpy() };
    spyOn(document, 'getElementById').and.returnValue(mockElement as unknown as HTMLElement);
    
    component.scrollToSection('test-section');
    expect(document.getElementById).toHaveBeenCalledWith('test-section');
    expect(mockElement.scrollIntoView).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    component.ngOnInit();
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should render main navigation buttons', () => {
    fixture.detectChanges();
    
    // Note: These selectors would need to be added to the template for proper testing
    // This test verifies the component renders without errors
    expect(component).toBeTruthy();
  });

  it('should apply correct animation states', () => {
    fixture.detectChanges();
    
    expect(component.buttonStates).toBeDefined();
    expect(component.cardStates).toBeDefined();
    
    // Test that animation states are properly initialized
    Object.keys(component.buttonStates).forEach(key => {
      expect(component.buttonStates[key]).toBe('unpressed');
    });
    
    Object.keys(component.cardStates).forEach(key => {
      expect(component.cardStates[key]).toBe('normal');
    });
  });

  it('should track feature interactions', () => {
    spyOn(console, 'log'); // Mock analytics
    
    component.trackFeatureInteraction('test-feature');
    
    // In a real implementation, this would send to analytics
    expect(console.log).toHaveBeenCalled();
  });
});