import { Injectable } from '@angular/core';
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
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const hasPermission = await this.requestNotificationPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      badge: '/assets/icons/icon-72x72.png',
      icon: '/assets/icons/icon-192x192.png',
      ...options
    };

    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      // Use service worker for better reliability
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, defaultOptions);
    } else {
      // Fallback to regular notification
      new Notification(title, defaultOptions);
    }
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
}