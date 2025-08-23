import { checkDatabaseHealth, DatabaseHealthStatus } from '../utils/databaseHealth';
import { AppDataSource } from '../config/database';

// Mock AppDataSource
jest.mock('../config/database', () => ({
  AppDataSource: {
    isInitialized: true,
    query: jest.fn(),
    options: {
      database: 'test_db'
    }
  }
}));

describe('databaseHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource as any).isInitialized = true;
    (AppDataSource as any).options = { database: 'test_db' };
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy status when database is connected and all tables exist', async () => {
      const mockTables = [
        { TABLE_NAME: 'quiz_sessions' },
        { TABLE_NAME: 'questions' },
        { TABLE_NAME: 'teams' },
        { TABLE_NAME: 'answers' },
        { TABLE_NAME: 'sequence_answers' },
        { TABLE_NAME: 'session_events' },
        { TABLE_NAME: 'session_configurations' },
        { TABLE_NAME: 'question_sets' },
        { TABLE_NAME: 'themes' },
        { TABLE_NAME: 'api_keys' }
      ];

      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockTables); // table existence query

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        tablesExist: true,
        tableDetails: {
          existingTables: ['quiz_sessions', 'questions', 'teams', 'answers', 'sequence_answers', 'session_events', 'session_configurations', 'question_sets', 'themes', 'api_keys'],
          missingTables: []
        }
      });
    });

    it('should return unhealthy status when database is not initialized', async () => {
      (AppDataSource as any).isInitialized = false;

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        tablesExist: false,
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
        tablesExist: false,
        error: 'Connection timeout'
      });
    });

    it('should detect missing tables', async () => {
      const mockTables = [
        { TABLE_NAME: 'quiz_sessions' },
        { TABLE_NAME: 'questions' },
        { TABLE_NAME: 'teams' }
        // Missing: answers, sequence_answers, session_events, session_configurations, question_sets, themes, api_keys
      ];

      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockResolvedValueOnce(mockTables); // table existence query

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        tablesExist: false,
        error: 'Missing tables: answers, sequence_answers, session_events, session_configurations, question_sets, themes, api_keys',
        tableDetails: {
          existingTables: ['quiz_sessions', 'questions', 'teams'],
          missingTables: ['answers', 'sequence_answers', 'session_events', 'session_configurations', 'question_sets', 'themes', 'api_keys']
        }
      });
    });

    it('should handle table query errors', async () => {
      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockRejectedValueOnce(new Error('Table query failed')); // table query fails

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        tablesExist: false,
        error: 'Table query failed'
      });
    });

    it('should handle non-Error objects in table query', async () => {
      (AppDataSource as any).query
        .mockResolvedValueOnce([1]) // SELECT 1 for connection test
        .mockRejectedValueOnce('Non-Error object'); // table query fails with non-Error

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: true,
        tablesExist: false,
        error: 'Non-Error object'
      });
    });

    it('should handle connection test failures', async () => {
      (AppDataSource as any).query.mockRejectedValue(new Error('Connection failed'));

      const result = await checkDatabaseHealth();

      expect(result).toEqual({
        connected: false,
        tablesExist: false,
        error: 'Connection failed'
      });
    });
  });
});