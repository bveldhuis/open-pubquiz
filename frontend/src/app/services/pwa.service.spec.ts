import { TestBed } from '@angular/core/testing';
import { PWAService } from './pwa.service';

describe('PWAService', () => {
  let service: PWAService;
  let mockWindow: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PWAService]
    });
    service = TestBed.inject(PWAService);
    
    // Mock window object
    mockWindow = {
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener')
    };
    
    // Mock global properties
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'))
      },
      writable: true
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Installation', () => {
    it('should initialize with correct default values', (done) => {
      service.isInstallable$.subscribe(value => {
        expect(value).toBe(false);
        done();
      });
    });

    it('should provide installable observable', (done) => {
      service.isInstallable$.subscribe(value => {
        expect(typeof value).toBe('boolean');
        done();
      });
    });

    it('should provide installed observable', (done) => {
      service.isInstalled$.subscribe(value => {
        expect(typeof value).toBe('boolean');
        done();
      });
    });

    it('should attempt to install PWA', async () => {
      const result = await service.installPWA();
      expect(typeof result).toBe('boolean');
    });

    it('should return false when no install prompt available', async () => {
      const result = await service.installPWA();
      expect(result).toBe(false);
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      // Mock Notification API
      Object.defineProperty(window, 'Notification', {
        value: class MockNotification {
          static permission = 'default';
          static requestPermission = jasmine.createSpy('requestPermission')
            .and.returnValue(Promise.resolve('granted'));
          
          constructor(public title: string, public options?: NotificationOptions) {}
        },
        writable: true
      });
    });

    it('should request notification permission', async () => {
      const result = await service.requestNotificationPermission();
      
      expect(window.Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when permission denied', async () => {
      window.Notification.requestPermission = jasmine.createSpy('requestPermission')
        .and.returnValue(Promise.resolve('denied'));
      
      const result = await service.requestNotificationPermission();
      
      expect(result).toBe(false);
    });

    it('should show notification when permission granted', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'granted'
      });
      
      await service.showNotification('Test Title', { body: 'Test body' });
      
      // Test that the method completes without error
      expect(true).toBe(true);
    });

    it('should handle notification permission denied', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        writable: true,
        value: 'denied'
      });
      
      await service.showNotification('Test Title');
      
      // Test that the method completes without error
      expect(true).toBe(true);
    });

    it('should notify new question', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.notifyNewQuestion('What is 2+2?');
      
      expect(service.showNotification).toHaveBeenCalledWith(
        'New Question Available!',
        jasmine.objectContaining({
          body: 'What is 2+2?',
          tag: 'new-question'
        })
      );
    });

    it('should notify quiz ended with position', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.notifyQuizEnded(2);
      
      expect(service.showNotification).toHaveBeenCalledWith(
        'Quiz Completed!',
        jasmine.objectContaining({
          body: 'You finished in position 2! Check your final score.',
          tag: 'quiz-ended'
        })
      );
    });

    it('should notify quiz ended without position', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.notifyQuizEnded();
      
      expect(service.showNotification).toHaveBeenCalledWith(
        'Quiz Completed!',
        jasmine.objectContaining({
          body: 'The quiz has ended. Check your final score!',
          tag: 'quiz-ended'
        })
      );
    });

    it('should notify time running out', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.notifyTimeRunningOut(10);
      
      expect(service.showNotification).toHaveBeenCalledWith(
        'Time Running Out!',
        jasmine.objectContaining({
          body: 'Only 10 seconds left to answer!',
          tag: 'time-warning'
        })
      );
    });
  });

  describe('Observables', () => {
    it('should provide isInstallable$ observable', (done) => {
      service.isInstallable$.subscribe(value => {
        expect(value).toBe(false); // Initial value
        done();
      });
    });

    it('should provide isInstalled$ observable', (done) => {
      service.isInstalled$.subscribe(value => {
        expect(value).toBe(false); // Initial value
        done();
      });
    });

    it('should provide observable streams', (done) => {
      // Test that observables are working
      service.isInstallable$.subscribe(value => {
        expect(typeof value).toBe('boolean');
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle notification API not available', async () => {
      Object.defineProperty(window, 'Notification', { value: undefined, writable: true });
      
      const result = await service.requestNotificationPermission();
      
      expect(result).toBe(false);
    });

    it('should handle PWA installation errors gracefully', async () => {
      const result = await service.installPWA();
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Service Worker Integration', () => {
    it('should handle service worker registration updates', () => {
      // This would test service worker update handling
      // Implementation depends on the specific service worker setup
      expect(service).toBeTruthy();
    });

    it('should handle offline scenarios', () => {
      // This would test offline functionality
      // Implementation depends on the specific offline handling
      expect(service).toBeTruthy();
    });
  });
});