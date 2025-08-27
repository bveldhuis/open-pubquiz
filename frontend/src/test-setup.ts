// Test setup for Angular tests
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';

// declare const require: {
//   context(path: string, deep?: boolean, filter?: RegExp): {
//     <T>(id: string): T;
//     keys(): string[];
//   };
// };

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Global test setup
beforeEach(() => {
  // Mock Router to fix "Cannot read properties of undefined (reading 'root')" error
  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
    createUrlTree: jasmine.createSpy('createUrlTree'),
    serializeUrl: jasmine.createSpy('serializeUrl'),
    parseUrl: jasmine.createSpy('parseUrl'),
    isActive: jasmine.createSpy('isActive'),
    events: {
      pipe: jasmine.createSpy('pipe').and.returnValue({ subscribe: jasmine.createSpy() })
    },
    url: '/',
    routerState: {
      snapshot: {
        url: '/',
        root: {
          children: []
        }
      }
    },
    config: [],
    root: {
      component: null,
      data: {},
      outlet: 'primary',
      url: [],
      params: {},
      queryParams: {},
      fragment: null,
      firstChild: null,
      children: []
    }
  };

  // Mock the Router provider globally
  getTestBed().overrideProvider(Router, { useValue: mockRouter });

  // Mock matchMedia with proper function implementations for Angular CDK
  // This needs to be a more comprehensive mock that handles all MediaQueryList creation
  // const _originalMatchMedia = window.matchMedia;
  
  // Create a mock MediaQueryList class
  class MockMediaQueryList {
    matches: boolean;
    media: string;
    onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null;
    private _listeners: ((ev: MediaQueryListEvent) => void)[] = [];
    private _eventListeners: Record<string, EventListener[]> = {};

    constructor(query: string) {
      this.matches = false;
      this.media = query;
      this.onchange = null;
    }

    addListener(callback: (ev: MediaQueryListEvent) => void): void {
      this._listeners.push(callback);
    }

    removeListener(callback: (ev: MediaQueryListEvent) => void): void {
      const index = this._listeners.indexOf(callback);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    }

    addEventListener(type: string, callback: EventListener): void {
      if (!this._eventListeners[type]) {
        this._eventListeners[type] = [];
      }
      this._eventListeners[type].push(callback);
    }

    removeEventListener(type: string, callback: EventListener): void {
      if (this._eventListeners[type]) {
        const index = this._eventListeners[type].indexOf(callback);
        if (index > -1) {
          this._eventListeners[type].splice(index, 1);
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispatchEvent(_event: Event): boolean {
      return true;
    }
  }

  // Replace window.matchMedia with our mock
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => new MockMediaQueryList(query),
  });

  // Ensure MediaQueryListEvent is available for the CDK
  if (!window.MediaQueryListEvent) {
    (window as unknown as { MediaQueryListEvent?: unknown }).MediaQueryListEvent = class MockMediaQueryListEvent extends Event {
      constructor(type: string, eventInitDict?: MediaQueryListEventInit) {
        super(type, eventInitDict);
      }
    };
  }

  // Mock IntersectionObserver
  (global as typeof globalThis).IntersectionObserver = class MockIntersectionObserver {
    root: Element | null = null;
    rootMargin = '';
    thresholds: readonly number[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
    takeRecords(): IntersectionObserverEntry[] { return []; }
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    constructor(_callback: ResizeObserverCallback) {}
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };

  // Mock navigator with a more robust approach
  const mockNavigator = {
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
  };

  // Ensure navigator is properly mocked and cannot be overridden
  Object.defineProperty(window, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true
  });

  // Also ensure navigator is available globally
  (global as unknown as { navigator: unknown }).navigator = mockNavigator;

  // Mock window.ontouchstart to be undefined for non-touch device detection
  Object.defineProperty(window, 'ontouchstart', {
    value: undefined,
    writable: true,
    configurable: true
  });

  // Mock Notification API
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: class MockNotification {
      static permission = 'default';
      static requestPermission = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
      constructor(_title: string, _options?: NotificationOptions) {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      close(): void {}
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
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Angular animations are suppressed by using NoopAnimationsModule in individual tests

// Helper function to create mock services
export function createMockService<T>(methods: (keyof T)[], properties?: Partial<T>): jasmine.SpyObj<T> {
  const spy = jasmine.createSpyObj('MockService', methods as string[], properties);
  return spy;
}

// Helper function to create mock component dependencies
export function createMockDependencies(): Record<string, unknown> {
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
  createMockQuestion: (overrides: Record<string, unknown> = {}) => ({
    id: '1',
    question_text: 'Test Question',
    question_type: 'multiple_choice',
    time_limit: 30,
    points: 10,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'A',
    ...overrides
  }),

  createMockSession: (overrides: Record<string, unknown> = {}) => ({
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
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jasmine {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<T> {
      toHaveBeenCalledWithObjectContaining(expected: Record<string, unknown>): boolean;
    }
  }
}

beforeEach(() => {
  jasmine.addMatchers({
    toHaveBeenCalledWithObjectContaining: () => ({
      compare: (actual: jasmine.Spy, expected: Record<string, unknown>) => {
        const calls = actual.calls.all();
        const match = calls.some(call => 
          call.args.some(arg => 
            typeof arg === 'object' && 
            Object.keys(expected).every(key => (arg as Record<string, unknown>)[key] === expected[key])
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
  mockReducedMotion: (enabled = true) => {
    class MockMediaQueryListWithReducedMotion {
      matches: boolean;
      media: string;
      onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null;
      private _listeners: ((ev: MediaQueryListEvent) => void)[] = [];
      private _eventListeners: Record<string, EventListener[]> = {};

      constructor(query: string) {
        this.matches = query === '(prefers-reduced-motion: reduce)' ? enabled : false;
        this.media = query;
        this.onchange = null;
      }

      addListener(callback: (ev: MediaQueryListEvent) => void): void {
        this._listeners.push(callback);
      }

      removeListener(callback: (ev: MediaQueryListEvent) => void): void {
        const index = this._listeners.indexOf(callback);
        if (index > -1) {
          this._listeners.splice(index, 1);
        }
      }

      addEventListener(type: string, callback: EventListener): void {
        if (!this._eventListeners[type]) {
          this._eventListeners[type] = [];
        }
        this._eventListeners[type].push(callback);
      }

      removeEventListener(type: string, callback: EventListener): void {
        if (this._eventListeners[type]) {
          const index = this._eventListeners[type].indexOf(callback);
          if (index > -1) {
            this._eventListeners[type].splice(index, 1);
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      dispatchEvent(_event: Event): boolean {
        return true;
      }
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => new MockMediaQueryListWithReducedMotion(query),
    });
  },

  // Helper to trigger keyboard events
  createKeyboardEvent: (key: string, type = 'keydown') => {
    return new KeyboardEvent(type, { key });
  },

  // Helper to trigger touch events
  createTouchEvent: (type: string, element: HTMLElement) => {
    const touch = {
      target: element,
      clientX: 100,
      clientY: 100,
      identifier: 0,
      pageX: 100,
      pageY: 100,
      screenX: 100,
      screenY: 100,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1
    } as unknown as Touch;
    
    const event = new TouchEvent(type, {
      touches: [touch]
    });
    return event;
  }
};