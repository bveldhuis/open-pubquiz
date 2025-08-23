#!/bin/sh

# Startup script for the backend container
# This script runs database migrations before starting the application

set -e

echo "Starting Open Pub Quiz Backend..."

# Function to check if database is ready
check_database() {
    echo "Checking database connection..."
    node -e "
    const mysql = require('mysql2/promise');
    
    async function checkDB() {
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'mysql',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USERNAME || 'pubquiz_user',
                password: process.env.DB_PASSWORD || 'pubquiz_password',
                database: process.env.DB_DATABASE || 'pubquiz'
            });
            await connection.ping();
            await connection.end();
            console.log('Database connection successful');
            process.exit(0);
        } catch (error) {
            console.log('Database not ready yet:', error.message);
            process.exit(1);
        }
    }
    
    checkDB();
    "
}

# Function to run migrations
run_migrations() {
    echo "Running database migrations..."
    
    # Check if we have the TypeScript source files (development mode)
    if [ -f "src/config/database.ts" ]; then
        echo "Running migrations in development mode..."
        npm run migration:run
    else
        echo "Running migrations in production mode..."
        # In production, we need to use the compiled JavaScript
        node -e "
        const { DataSource } = require('typeorm');
        const path = require('path');
        
        const AppDataSource = new DataSource({
            type: 'mysql',
            host: process.env.DB_HOST || 'mysql',
            port: parseInt(process.env.DB_PORT) || 3306,
            username: process.env.DB_USERNAME || 'pubquiz_user',
            password: process.env.DB_PASSWORD || 'pubquiz_password',
            database: process.env.DB_DATABASE || 'pubquiz',
            entities: [path.join(__dirname, 'dist', 'entities', '*.js')],
            migrations: [path.join(__dirname, 'dist', 'database', 'migrations', '*.js')],
            synchronize: false,
            logging: false
        });
        
        AppDataSource.initialize()
            .then(() => {
                console.log('Data Source has been initialized!');
                return AppDataSource.runMigrations();
            })
            .then(() => {
                console.log('Migrations completed successfully!');
                process.exit(0);
            })
            .catch((error) => {
                console.error('Error during migration:', error);
                process.exit(1);
            });
        "
    fi
}

# Function to seed database (optional)
seed_database() {
    if [ "$SEED_DATABASE" = "true" ]; then
        echo "Seeding database..."
        # Check if we have the TypeScript source files (development mode)
        if [ -f "src/database/seed.ts" ]; then
            echo "Running seed in development mode..."
            npm run seed
        elif [ -f "dist/database/seed.js" ]; then
            echo "Running seed in production mode..."
            node dist/database/seed.js
        else
            echo "Seed script not found, skipping seeding"
        fi
    else
        echo "Database seeding skipped (set SEED_DATABASE=true to enable)"
    fi
}

# Wait for database to be ready
echo "Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if check_database; then
        echo "Database is ready!"
        break
    fi
    
    echo "Attempt $attempt/$max_attempts: Database not ready yet, waiting..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "ERROR: Database failed to become ready within the expected time"
    exit 1
fi

# Run migrations
run_migrations

# Seed database if requested
seed_database

# Start the application
echo "Starting application..."
exec node dist/index.js
