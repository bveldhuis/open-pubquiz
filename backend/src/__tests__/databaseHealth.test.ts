import { checkDatabaseHealth, DatabaseHealthStatus } from '../utils/databaseHealth';
import { MigrationInterface } from 'typeorm';

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
    mockAppDataSource.isInitialized = true;
    mockAppDataSource.migrations = [];
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

      mockAppDataSource.query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockExecutedMigrations); // migration query

      mockAppDataSource.migrations = mockMigrations;

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
      mockAppDataSource.isInitialized = false;

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        migrationsUpToDate: false,
        error: 'Database not initialized'
      });

      expect(mockAppDataSource.query).not.toHaveBeenCalled();
    });

    it('should return connection error when database query fails', async () => {
      const error = new Error('Connection timeout');
      mockAppDataSource.query.mockRejectedValue(error);

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

      mockAppDataSource.query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockExecutedMigrations); // migration query

      mockAppDataSource.migrations = mockMigrations;

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

    it('should handle migrations with undefined names', async () => {
      const mockExecutedMigrations = [
        { name: 'CreateTables1755701597437' }
      ];

      const mockMigrations: MigrationInterface[] = [
        { name: 'CreateTables1755701597437', up: jest.fn(), down: jest.fn() },
        { name: undefined, up: jest.fn(), down: jest.fn() }, // Migration with undefined name
        { name: 'UpdateEventTypeEnum1755701600000', up: jest.fn(), down: jest.fn() }
      ];

      mockAppDataSource.query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockExecutedMigrations); // migration query

      mockAppDataSource.migrations = mockMigrations;

      const result = await checkDatabaseHealth();

      expect(result.migrationDetails?.pendingMigrations).toEqual(['UpdateEventTypeEnum1755701600000']);
      expect(result.migrationsUpToDate).toBe(false);
    });

    it('should handle empty migration lists', async () => {
      mockAppDataSource.query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce([]); // empty migrations

      mockAppDataSource.migrations = [] as any[];

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

    it('should handle unknown errors gracefully', async () => {
      mockAppDataSource.query.mockRejectedValue('Non-Error object');

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        migrationsUpToDate: false,
        error: 'Unknown database error'
      });
    });

    it('should handle migration query errors', async () => {
      mockAppDataSource.query
        .mockResolvedValueOnce([1]) // SELECT 1 succeeds
        .mockRejectedValueOnce(new Error('Migration table not found')); // migration query fails

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        migrationsUpToDate: false,
        error: 'Migration table not found'
      });
    });
  });
});