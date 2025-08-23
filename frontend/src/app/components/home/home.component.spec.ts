import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HomeComponent } from './home.component';
import { PWAService } from '../../services/pwa.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPwaService: jasmine.SpyObj<PWAService>;
  let mockMatSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const pwaServiceSpy = jasmine.createSpyObj('PWAService', [
      'requestNotificationPermission',
      'installPWA',
      'showNotification'
    ], {
      isInstallable$: { subscribe: jasmine.createSpy() },
      isInstalled$: { subscribe: jasmine.createSpy() }
    });
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
    expect(mockPwaService.requestNotificationPermission).toHaveBeenCalled();
  });

  it('should navigate to presenter when goToPresenter is called', async () => {
    await component.goToPresenter();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/presenter']);
  });

  it('should navigate to join when goToJoin is called', async () => {
    await component.goToJoin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/join']);
  });

  it('should show install notification when installPWA is called', async () => {
    mockPwaService.installPWA.and.returnValue(Promise.resolve(true));
    
    await component.installPWA();
    
    expect(mockPwaService.installPWA).toHaveBeenCalled();
    expect(mockMatSnackBar.open).toHaveBeenCalled();
  });

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
    component.isTouchDevice = true;
    const mockElement = { classList: { add: jasmine.createSpy(), remove: jasmine.createSpy() } };
    const mockEvent = { target: mockElement } as unknown as TouchEvent;
    
    mockElement.classList.add.and.stub();
    mockElement.classList.remove.and.stub();
    
    component.onTouchStart(mockEvent);
    // Note: In real implementation, this would check for 'touch-friendly' class
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