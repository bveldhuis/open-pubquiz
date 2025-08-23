import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have Open Pub Quiz title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.toolbar-title')?.textContent).toContain('🎯 Open Pub Quiz');
  });

  it('should navigate to home when title is clicked', () => {
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to home when title is clicked with keyboard', () => {
    fixture.detectChanges();
    const titleElement = fixture.debugElement.query(By.css('.toolbar-title'));
    
    titleElement.triggerEventHandler('keydown.enter', null);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should render toolbar with navigation buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    const presenterButton = compiled.querySelector('[routerLink="/presenter"]');
    const joinButton = compiled.querySelector('[routerLink="/join"]');
    
    expect(presenterButton).toBeTruthy();
    expect(joinButton).toBeTruthy();
    expect(presenterButton?.textContent?.trim()).toContain('Presenter');
    expect(joinButton?.textContent?.trim()).toContain('Join Quiz');
  });

  it('should have router outlet for content', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should have proper accessibility attributes on title', () => {
    fixture.detectChanges();
    const titleElement = fixture.debugElement.query(By.css('.toolbar-title'));
    
    expect(titleElement.nativeElement.getAttribute('tabindex')).toBe('0');
    expect(titleElement.nativeElement.getAttribute('role')).toBe('button');
  });

  it('should have app container with proper styling', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const appContainer = compiled.querySelector('.app-container');
    
    expect(appContainer).toBeTruthy();
  });
});