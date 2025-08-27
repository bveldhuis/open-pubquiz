import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoContentStateComponent } from './no-content-state.component';

describe('NoContentStateComponent', () => {
  let component: NoContentStateComponent;
  let fixture: ComponentFixture<NoContentStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoContentStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NoContentStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default icon and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('mat-icon');
    const message = compiled.querySelector('p');

    expect(icon?.textContent?.trim()).toBe('info');
    expect(message?.textContent?.trim()).toBe('No content available');
  });

  it('should display custom icon and message', () => {
    component.icon = 'warning';
    component.message = 'Custom message';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('mat-icon');
    const message = compiled.querySelector('p');

    expect(icon?.textContent?.trim()).toBe('warning');
    expect(message?.textContent?.trim()).toBe('Custom message');
  });

  it('should have correct CSS classes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.no-content-state');

    expect(container).toBeTruthy();
  });
});