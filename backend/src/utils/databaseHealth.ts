import { AppDataSource } from '../config/database';
import { MigrationInterface } from 'typeorm';

export interface DatabaseHealthStatus {
  connected: boolean;
  migrationsUpToDate: boolean;
  error?: string;
  migrationDetails?: {
    pendingMigrations: string[];
    executedMigrations: string[];
  };
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  try {
    // Check if database is initialized and connected
    if (!AppDataSource.isInitialized) {
      return {
        connected: false,
        migrationsUpToDate: false,
        error: 'Database not initialized'
      };
    }

    // Test database connection
    await AppDataSource.query('SELECT 1');
    
    // Check migration status using the migration manager
    const pendingMigrations = await AppDataSource.migrations;
    const executedMigrations = await AppDataSource.query(
      'SELECT name FROM migrations ORDER BY timestamp'
    );
    
    // Get the list of executed migration names
    const executedMigrationNames = executedMigrations.map((migration: any) => migration.name);
    
    // Find pending migrations (migrations that exist but haven't been executed)
    const pendingMigrationNames = pendingMigrations
      .filter((migration: MigrationInterface) => migration.name && !executedMigrationNames.includes(migration.name))
      .map((migration: MigrationInterface) => migration.name!)
      .filter(Boolean);
    
    const migrationsUpToDate = pendingMigrationNames.length === 0;
    
    return {
      connected: true,
      migrationsUpToDate,
      migrationDetails: {
        pendingMigrations: pendingMigrationNames,
        executedMigrations: executedMigrationNames
      },
      ...(pendingMigrationNames.length > 0 && {
        error: `Found ${pendingMigrationNames.length} pending migration(s)`
      })
    };
  } catch (error) {
    return {
      connected: false,
      migrationsUpToDate: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}
