import { checkDatabaseHealth, DatabaseHealthStatus } from '../utils/databaseHealth';
import { MigrationInterface } from 'typeorm';
import { AppDataSource } from '../config/database';

// Mock AppDataSource
jest.mock('../config/database', () => ({
  AppDataSource: {
    isInitialized: true,
    query: jest.fn(),
    migrations: [] as any[],
  }
}));

describe('databaseHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource as any).isInitialized = true;
    (AppDataSource as any).migrations = [];
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy status when database is connected and migrations are up to date', async () => {
      const mockExecutedMigrations = [
        { name: 'CreateTables1755701597437' },
        { name: 'UpdateEventTypeEnum1755701600000' }
      ];

      const mockMigrations: MigrationInterface[] = [
        { name: 'CreateTables1755701597437', up: jest.fn(), down: jest.fn() },
        { name: 'UpdateEventTypeEnum1755701600000', up: jest.fn(), down: jest.fn() }
      ];

      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockExecutedMigrations); // migration query

      (AppDataSource as any).migrations = mockMigrations;

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        migrationsUpToDate: true,
        migrationDetails: {
          pendingMigrations: [],
          executedMigrations: ['CreateTables1755701597437', 'UpdateEventTypeEnum1755701600000']
        }
      });
    });

    it('should return unhealthy status when database is not initialized', async () => {
      (AppDataSource as any).isInitialized = false;

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        migrationsUpToDate: false,
        error: 'Database not initialized'
      });

      expect((AppDataSource as any).query).not.toHaveBeenCalled();
    });

    it('should return connection error when database query fails', async () => {
      const error = new Error('Connection timeout');
      (AppDataSource as any).query.mockRejectedValue(error);

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        migrationsUpToDate: false,
        error: 'Connection timeout'
      });
    });

    it('should detect pending migrations', async () => {
      const mockExecutedMigrations = [
        { name: 'CreateTables1755701597437' }
      ];

      const mockMigrations: MigrationInterface[] = [
        { name: 'CreateTables1755701597437', up: jest.fn(), down: jest.fn() },
        { name: 'UpdateEventTypeEnum1755701600000', up: jest.fn(), down: jest.fn() },
        { name: 'AddNewQuestionTypes1755787374620', up: jest.fn(), down: jest.fn() }
      ];

      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockExecutedMigrations); // migration query

      (AppDataSource as any).migrations = mockMigrations;

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        migrationsUpToDate: false,
        error: 'Found 2 pending migration(s)',
        migrationDetails: {
          pendingMigrations: ['UpdateEventTypeEnum1755701600000', 'AddNewQuestionTypes1755787374620'],
          executedMigrations: ['CreateTables1755701597437']
        }
      });
    });

    it('should handle empty migrations list', async () => {
      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce([]); // no executed migrations

      (AppDataSource as any).migrations = [];

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        migrationsUpToDate: true,
        migrationDetails: {
          pendingMigrations: [],
          executedMigrations: []
        }
      });
    });

    it('should handle migration query errors', async () => {
      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockRejectedValueOnce(new Error('Migration table not found')); // migration query fails

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        migrationsUpToDate: false,
        error: 'Migration table not found'
      });
    });

    it('should handle non-Error objects in migration query', async () => {
      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockRejectedValueOnce('Non-Error object'); // migration query fails with non-Error

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        migrationsUpToDate: false,
        error: 'Non-Error object'
      });
    });

    it('should handle connection test failures', async () => {
      (AppDataSource as any).query.mockRejectedValue(new Error('Connection failed'));

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        migrationsUpToDate: false,
        error: 'Connection failed'
      });
    });
  });
});