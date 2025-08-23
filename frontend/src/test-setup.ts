// Test setup for Angular tests
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Global test setup
beforeEach(() => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jasmine.createSpy('matchMedia').and.returnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: jasmine.createSpy(), // deprecated
      removeListener: jasmine.createSpy(), // deprecated
      addEventListener: jasmine.createSpy(),
      removeEventListener: jasmine.createSpy(),
      dispatchEvent: jasmine.createSpy(),
    }),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(callback: ResizeObserverCallback) {}
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    writable: true,
    value: {
      userAgent: 'Mozilla/5.0 (Test)',
      vibrate: jasmine.createSpy('vibrate'),
      share: jasmine.createSpy('share').and.returnValue(Promise.resolve()),
      clipboard: {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
        readText: jasmine.createSpy('readText').and.returnValue(Promise.resolve(''))
      },
      maxTouchPoints: 0,
      serviceWorker: {
        register: jasmine.createSpy('register').and.returnValue(Promise.resolve({
          addEventListener: jasmine.createSpy(),
          removeEventListener: jasmine.createSpy()
        }))
      }
    }
  });

  // Mock Notification API
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: class MockNotification {
      static permission = 'default';
      static requestPermission = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'));
      constructor(title: string, options?: NotificationOptions) {}
      close() {}
    }
  });

  // Mock console methods to avoid noise in tests
  spyOn(console, 'log').and.stub();
  spyOn(console, 'warn').and.stub();
  spyOn(console, 'error').and.stub();
});

afterEach(() => {
  // Clean up after each test
  // Note: Jasmine doesn't have global clearAllMocks/restoreAllMocks
  // Individual spies need to be reset in component tests if needed
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress Angular animations for faster testing
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Helper function to create mock services
export function createMockService<T>(methods: (keyof T)[], properties?: Partial<T>): jasmine.SpyObj<T> {
  const spy = jasmine.createSpyObj('MockService', methods as string[], properties);
  return spy;
}

// Helper function to create mock component dependencies
export function createMockDependencies() {
  return {
    router: jasmine.createSpyObj('Router', ['navigate']),
    snackBar: jasmine.createSpyObj('MatSnackBar', ['open']),
    authService: jasmine.createSpyObj('AuthService', ['getCurrentSession', 'setCurrentUser', 'clearSession']),
    socketService: jasmine.createSpyObj('SocketService', ['connect', 'joinSession', 'leaveSession', 'on', 'emit']),
    pwaService: jasmine.createSpyObj('PWAService', [
      'requestNotificationPermission',
      'installPWA',
      'showNotification',
      'notifyNewQuestion',
      'notifyQuizEnded',
      'notifyTimeRunningOut'
    ], {
      isInstallable$: { subscribe: jasmine.createSpy() },
      isInstalled$: { subscribe: jasmine.createSpy() }
    })
  };
}

// Test data factories
export const TestDataFactory = {
  createMockQuestion: (overrides: Partial<any> = {}) => ({
    id: '1',
    question_text: 'Test Question',
    question_type: 'multiple_choice',
    time_limit: 30,
    points: 10,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'A',
    ...overrides
  }),

  createMockSession: (overrides: Partial<any> = {}) => ({
    teamName: 'Test Team',
    sessionCode: 'TEST123',
    ...overrides
  }),

  createMockLeaderboard: () => [
    { name: 'Team 1', total_points: 100, answers_submitted: 5, correct_answers: 4 },
    { name: 'Team 2', total_points: 80, answers_submitted: 5, correct_answers: 3 },
    { name: 'Team 3', total_points: 60, answers_submitted: 5, correct_answers: 2 }
  ]
};

// Custom matchers for better test assertions
declare global {
  namespace jasmine {
    interface Matchers<T> {
      toHaveBeenCalledWithObjectContaining(expected: any): boolean;
    }
  }
}

beforeEach(() => {
  jasmine.addMatchers({
    toHaveBeenCalledWithObjectContaining: () => ({
      compare: (actual: jasmine.Spy, expected: any) => {
        const calls = actual.calls.all();
        const match = calls.some(call => 
          call.args.some(arg => 
            typeof arg === 'object' && 
            Object.keys(expected).every(key => arg[key] === expected[key])
          )
        );
        
        return {
          pass: match,
          message: `Expected ${actual} to have been called with object containing ${JSON.stringify(expected)}`
        };
      }
    })
  });
});

// Add any global test utilities here
export const TestUtils = {
  // Simulate touch device
  mockTouchDevice: () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: { ...window.navigator, maxTouchPoints: 2 }
    });
  },

  // Simulate desktop device
  mockDesktopDevice: () => {
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: { ...window.navigator, maxTouchPoints: 0 }
    });
  },

  // Mock reduced motion preference
  mockReducedMotion: (enabled: boolean = true) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy('matchMedia').and.callFake((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? enabled : false,
        media: query,
        onchange: null,
        addListener: jasmine.createSpy(),
        removeListener: jasmine.createSpy(),
        addEventListener: jasmine.createSpy(),
        removeEventListener: jasmine.createSpy(),
        dispatchEvent: jasmine.createSpy(),
      })),
    });
  },

  // Helper to trigger keyboard events
  createKeyboardEvent: (key: string, type: string = 'keydown') => {
    return new KeyboardEvent(type, { key });
  },

  // Helper to trigger touch events
  createTouchEvent: (type: string, element: HTMLElement) => {
    const event = new TouchEvent(type, {
      touches: [{
        target: element,
        clientX: 100,
        clientY: 100
      } as Touch]
    });
    return event;
  }
};