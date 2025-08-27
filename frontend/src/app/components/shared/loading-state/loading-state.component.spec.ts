import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingStateComponent } from './loading-state.component';

describe('LoadingStateComponent', () => {
  let component: LoadingStateComponent;
  let fixture: ComponentFixture<LoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const message = compiled.querySelector('p');

    expect(message?.textContent?.trim()).toBe('Loading...');
  });

  it('should display custom message', () => {
    component.message = 'Please wait...';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const message = compiled.querySelector('p');

    expect(message?.textContent?.trim()).toBe('Please wait...');
  });

  it('should have spinner with correct diameter', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('mat-spinner');

    expect(spinner).toBeTruthy();
    expect(spinner?.getAttribute('ng-reflect-diameter')).toBe('40');
  });

  it('should have correct CSS classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.loading-state');

    expect(container).toBeTruthy();
  });
});