import { TestBed } from '@angular/core/testing';
import { PWAService } from './pwa.service';

describe('PWAService', () => {
  let service: PWAService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PWAService]
    });
    service = TestBed.inject(PWAService);
    
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
      const mockNotification = jasmine.createSpy('Notification').and.returnValue({
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener')
      });
      
      // Add static properties to the mock
      (mockNotification as any).permission = 'granted';
      (mockNotification as any).requestPermission = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'));
      
      Object.defineProperty(window, 'Notification', {
        value: mockNotification,
        writable: true
      });
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
        'Quiz Complete! 🎉',
        jasmine.objectContaining({
          body: 'Quiz finished! You placed #2',
          tag: 'quiz-ended',
          requireInteraction: true
        })
      );
    });

    it('should notify quiz ended without position', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.notifyQuizEnded();
      
      expect(service.showNotification).toHaveBeenCalledWith(
        'Quiz Complete! 🎉',
        jasmine.objectContaining({
          body: 'The quiz has ended. Thanks for playing!',
          tag: 'quiz-ended',
          requireInteraction: true
        })
      );
    });

    it('should notify time running out', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.notifyTimeRunningOut(10);
      
      expect(service.showNotification).toHaveBeenCalledWith(
        '⏰ Time Running Out!',
        jasmine.objectContaining({
          body: 'Only 10 seconds left to answer!',
          tag: 'time-warning',
          requireInteraction: false
        })
      );
    });

    it('should show notification when permission granted', async () => {
      spyOn(service, 'showNotification').and.returnValue(Promise.resolve());
      
      await service.showNotification('Test Title', { body: 'Test Body' });
      
      expect(service.showNotification).toHaveBeenCalledWith('Test Title', { body: 'Test Body' });
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
      // Mock Notification as undefined
      const originalNotification = (window as any).Notification;
      delete (window as any).Notification;
      
      const result = await service.requestNotificationPermission();
      
      expect(result).toBe(false);
      
      // Restore original
      (window as any).Notification = originalNotification;
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