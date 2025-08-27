import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstallableSubject = new BehaviorSubject<boolean>(false);
  private isInstalledSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializePWA();
    this.checkIfInstalled();
  }

  get isInstallable$(): Observable<boolean> {
    return this.isInstallableSubject.asObservable();
  }

  get isInstalled$(): Observable<boolean> {
    return this.isInstalledSubject.asObservable();
  }

  private initializePWA(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.isInstallableSubject.next(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.isInstallableSubject.next(false);
      this.isInstalledSubject.next(true);
      
      // Show success message
      this.showInstallationSuccess();
    });
  }

  private checkIfInstalled(): void {
    // Check if app is running in standalone mode (PWA installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalledSubject.next(true);
    }
    
    // Check for iOS Safari PWA
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) {
      this.isInstalledSubject.next(true);
    }
  }

  async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      // Show the prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.deferredPrompt = null;
        this.isInstallableSubject.next(false);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }

  private showInstallationSuccess(): void {
    // Create a simple success notification
    const notification = document.createElement('div');
    notification.className = 'pwa-install-success';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
      ">
        <strong>🎉 App Installed!</strong>
        <br>Open Pub Quiz has been added to your device.
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Push Notification Support
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, we might want to be more conservative about requesting permissions
        // Only request if the user is actively engaging with the app
        console.log('Mobile device detected - notification permission will be requested when needed');
      }
      
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
        return false;
      }
    }

    return false;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    try {
      console.log('PWA Service: Attempting to show notification:', title);
      
      // In development mode, show a visual notification since service workers aren't enabled
      if (isDevMode()) {
        console.log('PWA Service: Development mode - showing visual notification instead');
        this.showDevelopmentNotification(title, options);
        return;
      }
      
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const hasPermission = await this.requestNotificationPermission();
      
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        this.showVisualFeedback('Notification permission required for quiz updates');
        return;
      }

      const defaultOptions: NotificationOptions = {
        badge: '/favicon.ico',
        icon: '/favicon.ico',
        ...options
      };

      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        // Use service worker for better reliability
        try {
          // Increase timeout for mobile devices
          const timeout = isMobile ? 5000 : 3000;
          
          // Add timeout to prevent hanging
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Service worker registration timeout')), timeout)
            )
          ]) as ServiceWorkerRegistration;
          
          console.log('PWA Service: Service worker ready, showing notification');
          
          // Add additional check for mobile devices
          if (isMobile && registration.active?.state !== 'activated') {
            console.warn('PWA Service: Service worker not fully activated on mobile, using fallback');
            throw new Error('Service worker not ready on mobile');
          }
          
          await registration.showNotification(title, defaultOptions);
          console.log('PWA Service: Notification shown via service worker');
        } catch (swError) {
          console.warn('PWA Service: Service worker notification failed, falling back to regular notification:', swError);
          // Fallback to regular notification
          const notification = new Notification(title, defaultOptions);
          console.log('PWA Service: Fallback notification created:', notification);
        }
      } else {
        // Fallback to regular notification
        console.log('PWA Service: Using regular notification (no service worker)');
        const notification = new Notification(title, defaultOptions);
        console.log('PWA Service: Regular notification created:', notification);
      }
      
      console.log('PWA Service: Notification shown successfully');
    } catch (error) {
      console.error('PWA Service: Failed to show notification:', error);
      
      // Show fallback visual notification
      this.showVisualFeedback(`Notification failed: ${title}`);
    }
  }

  private showDevelopmentNotification(title: string, options?: NotificationOptions): void {
    const body = options?.body || '';
    const message = `📱 ${title}${body ? `: ${body}` : ''}`;
    
    // Create a visual notification element
    const notification = document.createElement('div');
    notification.className = 'dev-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196f3;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      ">
        <strong>DEV NOTIFICATION</strong><br>
        ${message}
        <button onclick="this.parentElement.parentElement.remove()" style="
          position: absolute;
          top: 4px;
          right: 6px;
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
    
    console.log('PWA Service: Development notification shown:', message);
  }

  private showVisualFeedback(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'visual-feedback';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      ">
        ${message}
        <button onclick="this.parentElement.parentElement.remove()" style="
          position: absolute;
          top: 4px;
          right: 6px;
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }

  // Quiz-specific notification methods
  async notifyNewQuestion(questionText: string): Promise<void> {
    await this.showNotification('New Question Available!', {
      body: questionText,
      tag: 'new-question'
    });
  }

  async notifyQuizEnded(finalPosition?: number): Promise<void> {
    const body = finalPosition 
      ? `Quiz finished! You placed #${finalPosition}` 
      : 'The quiz has ended. Thanks for playing!';
      
    await this.showNotification('Quiz Complete! 🎉', {
      body,
      tag: 'quiz-ended',
      requireInteraction: true
    });
  }

  async notifyTimeRunningOut(secondsLeft: number): Promise<void> {
    if (secondsLeft <= 10) {
      await this.showNotification('⏰ Time Running Out!', {
        body: `Only ${secondsLeft} seconds left to answer!`,
        tag: 'time-warning',
        requireInteraction: false
      });
    }
  }

  // Show a user-friendly message about notification status
  async showNotificationStatus(): Promise<void> {
    const support = await this.checkNotificationSupport();
    
    if (!support.supported) {
      console.log('Notifications not supported on this device/browser');
      return;
    }
    
    if (support.permission === 'denied') {
      console.log('Notification permission denied by user');
      return;
    }
    
    if (support.permission === 'default') {
      console.log('Notification permission not yet requested');
      return;
    }
    
    if (support.permission === 'granted' && !support.serviceWorkerReady) {
      console.log('Notifications granted but service worker not ready');
      return;
    }
    
    console.log('Notifications are working properly');
  }

  // Check if browser supports PWA features
  get browserSupport(): {
    notifications: boolean;
    serviceWorker: boolean;
    installPrompt: boolean;
  } {
    return {
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      installPrompt: 'BeforeInstallPromptEvent' in window
    };
  }

  // Check if notifications are actually working on this device
  async checkNotificationSupport(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    serviceWorkerReady: boolean;
    mobile: boolean;
  }> {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    
    let serviceWorkerReady = false;
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        serviceWorkerReady = registration.active?.state === 'activated';
      } catch {
        serviceWorkerReady = false;
      }
    }
    
    return {
      supported,
      permission,
      serviceWorkerReady,
      mobile: isMobile
    };
  }
}