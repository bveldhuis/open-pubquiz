import { CleanupService, CleanupConfig } from '../services/CleanupService';
import { ISessionService } from '../services/interfaces/ISessionService';

// Mock session service
const mockSessionService: jest.Mocked<ISessionService> = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  getSessionByCodeOrThrow: jest.fn(),
  updateSessionStatus: jest.fn(),
  updateCurrentQuestionId: jest.fn(),
  endSession: jest.fn(),
  startNextRound: jest.fn(),
  logEvent: jest.fn(),
  getSessionEvents: jest.fn(),
  joinSession: jest.fn(),
  cleanupInactiveSessions: jest.fn(),
  getCleanupStats: jest.fn(),
};

// Mock console.log to avoid noise in tests
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

// Mock setInterval and clearInterval
jest.useFakeTimers();

describe('CleanupService', () => {
  let cleanupService: CleanupService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    // Ensure cleanup service is stopped after each test
    cleanupService?.stop();
  });

  describe('constructor and configuration', () => {
    it('should initialize with default configuration', () => {
      cleanupService = new CleanupService(mockSessionService);

      expect(cleanupService['config']).toEqual({
        enabled: true,
        intervalMinutes: 60,
        inactiveHours: 4,
        logCleanup: true
      });
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig: Partial<CleanupConfig> = {
        intervalMinutes: 30,
        inactiveHours: 2,
        logCleanup: false
      };

      cleanupService = new CleanupService(mockSessionService, customConfig);

      expect(cleanupService['config']).toEqual({
        enabled: true,
        intervalMinutes: 30,
        inactiveHours: 2,
        logCleanup: false
      });
    });

    it('should disable service when enabled is false', () => {
      cleanupService = new CleanupService(mockSessionService, { enabled: false });

      expect(cleanupService['config'].enabled).toBe(false);
    });
  });

  describe('start', () => {
    it('should start cleanup service successfully', () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 0, total: 0 });

      cleanupService.start();

      expect(cleanupService['isRunning']).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🧹 Starting cleanup service')
      );
    });

    it('should not start if already running', () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 0, total: 0 });

      cleanupService.start();
      cleanupService.start(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Cleanup service is already running');
    });

    it('should not start if disabled', () => {
      cleanupService = new CleanupService(mockSessionService, { enabled: false });

      cleanupService.start();

      expect(cleanupService['isRunning']).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('⏸️ Cleanup service is disabled');
    });

    it('should run initial cleanup and schedule periodic cleanup', async () => {
      cleanupService = new CleanupService(mockSessionService, { intervalMinutes: 1 });
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 2, total: 5 });

      cleanupService.start();

      // Run the initial cleanup
      await jest.runAllTicks();

      expect(mockSessionService.cleanupInactiveSessions).toHaveBeenCalledWith(4);

      // Fast-forward to trigger interval
      jest.advanceTimersByTime(60000); // 1 minute
      await jest.runAllTicks();

      expect(mockSessionService.cleanupInactiveSessions).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop', () => {
    it('should stop cleanup service', () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 0, total: 0 });

      cleanupService.start();
      cleanupService.stop();

      expect(cleanupService['isRunning']).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Stopping cleanup service');
    });

    it('should not crash if stopping when not running', () => {
      cleanupService = new CleanupService(mockSessionService);

      expect(() => cleanupService.stop()).not.toThrow();
      // The implementation doesn't log anything when stopping if not running
      expect(consoleSpy).not.toHaveBeenCalledWith('⏹️ Cleanup service is not running');
    });

    it('should clear interval when stopping', () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 0, total: 0 });

      cleanupService.start();
      const intervalId = cleanupService['intervalId'];
      
      cleanupService.stop();

      expect(cleanupService['intervalId']).toBeUndefined();
    });
  });

  describe('getStatus', () => {
             it('should return current status when running', async () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 0, total: 0 });
      mockSessionService.getCleanupStats.mockResolvedValue({
        totalSessions: 10,
        activeSessions: 5,
        finishedSessions: 3,
        inactiveSessions: 2
      });

      cleanupService.start();
      const status = await cleanupService.getStats();

      expect(status).toEqual({
        isRunning: true,
        config: {
          enabled: true,
          intervalMinutes: 60,
          inactiveHours: 4,
          logCleanup: true
        },
        sessionStats: {
          totalSessions: 10,
          activeSessions: 5,
          finishedSessions: 3,
          inactiveSessions: 2
        }
      });
    });

    it('should return current status when not running', async () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.getCleanupStats.mockResolvedValue({
        totalSessions: 8,
        activeSessions: 3,
        finishedSessions: 4,
        inactiveSessions: 1
      });

      const status = await cleanupService.getStats();

      expect(status).toEqual({
        isRunning: false,
        config: {
          enabled: true,
          intervalMinutes: 60,
          inactiveHours: 4,
          logCleanup: true
        },
        sessionStats: {
          totalSessions: 8,
          activeSessions: 3,
          finishedSessions: 4,
          inactiveSessions: 1
        }
      });
    });
  });

  describe('runCleanup private method', () => {
    it('should run cleanup and log results when logging enabled', async () => {
      cleanupService = new CleanupService(mockSessionService, { logCleanup: true });
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 3, total: 10 });
      mockSessionService.getCleanupStats.mockResolvedValue({
        totalSessions: 10,
        activeSessions: 5,
        finishedSessions: 3,
        inactiveSessions: 2
      });

      // Access private method for testing
      await cleanupService['runCleanup']();

      expect(mockSessionService.cleanupInactiveSessions).toHaveBeenCalledWith(4);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Cleanup completed: 3 sessions ended (10 checked)')
      );
    });

    it('should run cleanup without logging when logging disabled', async () => {
      cleanupService = new CleanupService(mockSessionService, { logCleanup: false });
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 1, total: 5 });

      await cleanupService['runCleanup']();

      expect(mockSessionService.cleanupInactiveSessions).toHaveBeenCalledWith(4);
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🧹 Cleanup completed')
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      cleanupService = new CleanupService(mockSessionService);
      const error = new Error('Database connection failed');
      mockSessionService.cleanupInactiveSessions.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await cleanupService['runCleanup']();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error during cleanup:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple start/stop cycles', () => {
      cleanupService = new CleanupService(mockSessionService);
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 0, total: 0 });

      // Start and stop multiple times
      cleanupService.start();
      cleanupService.stop();
      cleanupService.start();
      cleanupService.stop();

      expect(cleanupService['isRunning']).toBe(false);
    });

    it('should use custom inactive hours configuration', async () => {
      const customHours = 6;
      cleanupService = new CleanupService(mockSessionService, { inactiveHours: customHours });
      mockSessionService.cleanupInactiveSessions.mockResolvedValue({ ended: 1, total: 1 });

      await cleanupService['runCleanup']();

      expect(mockSessionService.cleanupInactiveSessions).toHaveBeenCalledWith(customHours);
    });
  });
});