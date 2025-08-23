import { AppDataSource } from '../config/database';

export interface DatabaseHealthStatus {
  connected: boolean;
  tablesExist: boolean;
  error?: string;
  tableDetails?: {
    existingTables: string[];
    missingTables: string[];
  };
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  // Check if database is initialized
  if (!AppDataSource.isInitialized) {
    return {
      connected: false,
      tablesExist: false,
      error: 'Database not initialized'
    };
  }

  // Test database connection first
  try {
    await AppDataSource.query('SELECT 1');
  } catch (error) {
    return {
      connected: false,
      tablesExist: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }

  // If connection is successful, check if required tables exist
  try {
    const requiredTables = [
      'quiz_sessions',
      'questions', 
      'teams',
      'answers',
      'sequence_answers',
      'session_events',
      'session_configurations',
      'question_sets',
      'themes',
      'api_keys'
    ];

    const existingTablesResult = await AppDataSource.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = '${AppDataSource.options.database}' 
       AND TABLE_NAME IN (${requiredTables.map(() => '?').join(',')})`,
      requiredTables
    );
    
    const existingTables = existingTablesResult.map((row: any) => row.TABLE_NAME);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    const tablesExist = missingTables.length === 0;
    
    return {
      connected: true,
      tablesExist,
      tableDetails: {
        existingTables,
        missingTables
      },
      ...(missingTables.length > 0 && {
        error: `Missing tables: ${missingTables.join(', ')}`
      })
    };
  } catch (error) {
    // Connection is successful, but table check failed
    return {
      connected: true,
      tablesExist: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
