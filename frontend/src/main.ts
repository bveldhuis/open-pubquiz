import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { QuizService } from './app/services/quiz.service';
import { QuizManagementService } from './app/services/quiz-management.service';
import { SocketService } from './app/services/socket.service';
import { AuthService } from './app/services/auth.service';
import { PWAService } from './app/services/pwa.service';

const routes = [
  { path: '', loadComponent: () => import('./app/components/home/home.component').then(m => m.HomeComponent) },
  { path: 'presenter', loadComponent: () => import('./app/components/presenter/presenter.component').then(m => m.PresenterComponent) },
  { path: 'join', loadComponent: () => import('./app/components/join/join.component').then(m => m.JoinComponent) },
  { path: 'participant', loadComponent: () => import('./app/components/participant/participant.component').then(m => m.ParticipantComponent) },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    QuizService,
    QuizManagementService,
    SocketService,
    AuthService,
    PWAService
  ]
}).catch(err => console.error(err));

// Orientation handling
function handleOrientationChange() {
  const orientation = screen.orientation?.angle || 0;
  const isLandscape = Math.abs(orientation) === 90;
  
  document.body.classList.toggle('landscape', isLandscape);
  document.body.classList.toggle('portrait', !isLandscape);
  
  // Emit custom event for components to listen to
  window.dispatchEvent(new CustomEvent('orientationchange', {
    detail: { isLandscape, angle: orientation }
  }));
}

// Listen for orientation changes
if (screen.orientation) {
  screen.orientation.addEventListener('change', handleOrientationChange);
  handleOrientationChange(); // Set initial state
} else {
  // Fallback for older browsers
  window.addEventListener('orientationchange', () => {
    setTimeout(handleOrientationChange, 100);
  });
  handleOrientationChange();
}

// Viewport height fix for mobile browsers
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setViewportHeight);
setViewportHeight();

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// PWA Update handling
if ('serviceWorker' in navigator && !isDevMode()) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('Service Worker ready');
    
    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute
    
    // Listen for new service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available
            if (confirm('A new version is available. Reload to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });
  });
  
  // Handle service worker messages for push notifications
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      // Handle notification click
      const notificationData = event.data.data;
      if (notificationData?.action) {
        // Navigate to appropriate route based on notification action
        switch (notificationData.action) {
          case 'answer':
            window.focus();
            break;
          case 'view_quiz':
            window.focus();
            break;
        }
      }
    }
  });
}

// Enhanced error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Send error to monitoring service in production
  if (!isDevMode()) {
    // Placeholder for error monitoring
    console.warn('Error reporting would be sent in production');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Send error to monitoring service in production
  if (!isDevMode()) {
    // Placeholder for error monitoring
    console.warn('Promise rejection would be reported in production');
  }
});

// Performance monitoring
if ('performance' in window && 'PerformanceObserver' in window) {
  try {
    // Observe largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Observe first input delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry & { processingStart?: number }) => {
        if (entry.processingStart) {
          console.log('FID:', entry.processingStart - entry.startTime);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch {
    console.warn('Performance Observer not fully supported');
  }
}
