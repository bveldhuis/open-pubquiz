import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function createTables() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('�� Creating tables...');
    // Force synchronization to create tables
    await AppDataSource.synchronize(true);
    console.log('✅ Tables created successfully');

    console.log('📋 Created tables:');
    console.log('  - quiz_sessions');
    console.log('  - questions');
    console.log('  - teams');
    console.log('  - answers');
    console.log('  - sequence_answers');
    console.log('  - session_events');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();