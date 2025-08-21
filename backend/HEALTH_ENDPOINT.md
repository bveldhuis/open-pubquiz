# Health Endpoint Documentation

## Overview

The backend health endpoint (`/health`) provides comprehensive health status information including database connection and migration status.

## Endpoint

- **URL**: `GET /health`
- **Description**: Returns the health status of the backend service

## Response Format

### Successful Response (200 OK)
```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600.5,
  "database": {
    "connected": true,
    "migrationsUpToDate": true,
    "migrationDetails": {
      "pendingMigrations": [],
      "executedMigrations": [
        "1755701597437-CreateTables",
        "1755701600000-UpdateEventTypeEnum"
      ]
    }
  }
}
```

### Degraded Response (200 OK)
```json
{
  "status": "DEGRADED",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600.5,
  "database": {
    "connected": true,
    "migrationsUpToDate": false,
    "error": "Found 1 pending migration(s)",
    "migrationDetails": {
      "pendingMigrations": ["1755701700000-NewMigration"],
      "executedMigrations": [
        "1755701597437-CreateTables",
        "1755701600000-UpdateEventTypeEnum"
      ]
    }
  }
}
```

### Error Response (503 Service Unavailable)
```json
{
  "status": "ERROR",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600.5,
  "database": {
    "connected": false,
    "migrationsUpToDate": false,
    "error": "Database connection failed"
  }
}
```

## Status Codes

- **200 OK**: Service is healthy (database connected and migrations up to date)
- **200 OK (DEGRADED)**: Service is running but has issues (e.g., pending migrations)
- **503 Service Unavailable**: Service is unhealthy (database connection failed)

## Health Check Logic

The health endpoint performs the following checks:

1. **Database Connection**: Verifies that the database is initialized and can execute queries
2. **Migration Status**: Checks if all migrations have been applied to the database
3. **Overall Status**: Combines both checks to determine the overall health status

## Docker Health Check

The Docker container uses this endpoint for health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    let data = ''; \
    res.on('data', chunk => data += chunk); \
    res.on('end', () => { \
      try { \
        const health = JSON.parse(data); \
        process.exit(health.status === 'OK' ? 0 : 1); \
      } catch (e) { \
        process.exit(1); \
      } \
    }); \
  }).on('error', () => process.exit(1))"
```

## Docker Compose Integration

The docker-compose.yml includes health checks for the backend service:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (res) => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => { try { const health = JSON.parse(data); process.exit(health.status === 'OK' ? 0 : 1); } catch (e) { process.exit(1); } }); }).on('error', () => process.exit(1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

The frontend service depends on the backend being healthy:

```yaml
depends_on:
  backend:
    condition: service_healthy
```

## Usage Examples

### Check Health Status
```bash
curl http://localhost:3000/health
```

### Monitor Health in Scripts
```bash
# Check if service is fully healthy
curl -s http://localhost:3000/health | jq '.status == "OK"'

# Check database connection
curl -s http://localhost:3000/health | jq '.database.connected'

# Check migration status
curl -s http://localhost:3000/health | jq '.database.migrationsUpToDate'
```

## Troubleshooting

### Database Connection Issues
- Verify database credentials in environment variables
- Check if the database server is running
- Ensure network connectivity between backend and database

### Migration Issues
- Run pending migrations: `npm run migration:run`
- Check migration files in `src/database/migrations/`
- Verify migration table exists in database

### Health Check Failures
- Check backend logs for detailed error messages
- Verify the health endpoint is accessible
- Ensure all required environment variables are set
