const http = require('http');

function testHealthEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        console.log('Health Check Response:');
        console.log('Status Code:', res.statusCode);
        console.log('Overall Status:', health.status);
        console.log('Database Connected:', health.database?.connected);
        console.log('Migrations Up to Date:', health.database?.migrationsUpToDate);
        
        if (health.database?.error) {
          console.log('Database Error:', health.database.error);
        }
        
        if (health.database?.migrationDetails) {
          console.log('Executed Migrations:', health.database.migrationDetails.executedMigrations);
          console.log('Pending Migrations:', health.database.migrationDetails.pendingMigrations);
        }
        
        console.log('\nFull Response:');
        console.log(JSON.stringify(health, null, 2));
        
        // Exit with appropriate code
        process.exit(health.status === 'OK' ? 0 : 1);
      } catch (error) {
        console.error('Failed to parse health response:', error);
        console.log('Raw response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Health check failed:', error.message);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('Health check timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

// Run the test
console.log('Testing health endpoint...');
testHealthEndpoint();
