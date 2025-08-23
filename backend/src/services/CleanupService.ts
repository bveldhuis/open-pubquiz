import { ISessionService } from './interfaces/ISessionService';

export interface CleanupConfig {
  enabled: boolean;
  intervalMinutes: number;
  inactiveHours: number;
  logCleanup: boolean;
}

export class CleanupService {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private config: CleanupConfig;

  constructor(
    private sessionService: ISessionService,
    config: Partial<CleanupConfig> = {}
  ) {
    this.config = {
      enabled: true,
      intervalMinutes: 60, // Run every hour by default
      inactiveHours: 4, // End sessions inactive for 4+ hours
      logCleanup: true,
      ...config
    };
  }

  /**
   * Start the cleanup service
   */
  start(): void {
    if (this.isRunning) {
      console.log('🔄 Cleanup service is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('⏸️ Cleanup service is disabled');
      return;
    }

    console.log(`🧹 Starting cleanup service (interval: ${this.config.intervalMinutes} minutes, inactive threshold: ${this.config.inactiveHours} hours)`);
    
    this.isRunning = true;
    
    // Run initial cleanup
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.config.intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping cleanup service');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    this.isRunning = false;
  }

  /**
   * Run a single cleanup cycle
   */
  async runCleanup(): Promise<void> {
    try {
      console.log('🧹 Running session cleanup...');
      
      const startTime = Date.now();
      const result = await this.sessionService.cleanupInactiveSessions(this.config.inactiveHours);
      const duration = Date.now() - startTime;

      if (this.config.logCleanup) {
        if (result.ended > 0) {
          console.log(`✅ Cleanup completed: ${result.ended} sessions ended (${result.total} checked) in ${duration}ms`);
        } else {
          console.log(`✅ Cleanup completed: No inactive sessions found (${result.total} checked) in ${duration}ms`);
        }
      }

      // Log cleanup statistics
      try {
        const stats = await this.sessionService.getCleanupStats();
        if (this.config.logCleanup && stats) {
          console.log(`📊 Session stats: ${stats.activeSessions} active, ${stats.finishedSessions} finished, ${stats.inactiveSessions} inactive`);
        }
      } catch (statsError) {
        if (this.config.logCleanup) {
          console.log('📊 Unable to retrieve session statistics');
        }
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  async getStats(): Promise<{
    isRunning: boolean;
    config: CleanupConfig;
    sessionStats: {
      totalSessions: number;
      activeSessions: number;
      finishedSessions: number;
      inactiveSessions: number;
    };
  }> {
    const sessionStats = await this.sessionService.getCleanupStats();
    
    return {
      isRunning: this.isRunning,
      config: this.config,
      sessionStats
    };
  }

  /**
   * Update cleanup configuration
   */
  updateConfig(newConfig: Partial<CleanupConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning && this.config.enabled) {
      this.start();
    }
  }

  /**
   * Check if the service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}
