import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './config/database';
import { setupSocketHandlers } from './socket/socketHandlers';
import quizRoutes from './routes/quizRoutes';
import { teamRoutes } from './routes/teamRoutes';
import { questionRoutes } from './routes/questionRoutes';
import { answerRoutes } from './routes/answerRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { sessionConfigRoutes } from './routes/sessionConfigRoutes';
import { ServiceFactory } from './services/ServiceFactory';
import { checkDatabaseHealth } from './utils/databaseHealth';
import { specs } from './config/swagger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

// Make Socket.IO instance available to routes
app.set('io', io);

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     description: Check the health status of the application and database
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [OK, DEGRADED]
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Application uptime in seconds
 *                   example: 3600
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: true
 *                     migrationsUpToDate:
 *                       type: boolean
 *                       example: true
 *                     error:
 *                       type: string
 *                       nullable: true
 *                     migrationDetails:
 *                       type: object
 *                       nullable: true
 *       503:
 *         description: Application is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ERROR]
 *                   example: "ERROR"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                       example: false
 *                     migrationsUpToDate:
 *                       type: boolean
 *                       example: false
 *                     error:
 *                       type: string
 */
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const overallStatus = dbHealth.connected && dbHealth.migrationsUpToDate ? 'OK' : 'DEGRADED';
    const statusCode = dbHealth.connected ? 200 : 503;
    
    res.status(statusCode).json({ 
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbHealth.connected,
        migrationsUpToDate: dbHealth.migrationsUpToDate,
        ...(dbHealth.error && { error: dbHealth.error }),
        ...(dbHealth.migrationDetails && { migrationDetails: dbHealth.migrationDetails })
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: false,
        migrationsUpToDate: false,
        error: error instanceof Error ? error.message : 'Unknown error during health check'
      }
    });
  }
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Open Pub Quiz API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  }
}));

// API routes
app.use('/api/quiz', quizRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/session-config', sessionConfigRoutes);

// Socket.IO setup
setupSocketHandlers(io);

// Initialize cleanup service
let cleanupService: any = null;

async function initializeCleanupService() {
  try {
    const serviceFactory = ServiceFactory.getInstance();
    const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
    
    // Create cleanup service with configuration from environment variables
    cleanupService = serviceFactory.createCleanupService(sessionService, {
      enabled: process.env.CLEANUP_ENABLED !== 'false', // enabled by default
      intervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES || '60'), // every hour by default
      inactiveHours: parseInt(process.env.CLEANUP_INACTIVE_HOURS || '4'), // 4 hours by default
      logCleanup: process.env.CLEANUP_LOG !== 'false' // log by default
    });

    // Start the cleanup service
    cleanupService.start();
    console.log('✅ Cleanup service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize cleanup service:', error);
  }
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && err instanceof Error && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Open Pub Quiz Backend...');
    
    // Initialize database connection
    console.log('📊 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Initialize cleanup service
    await initializeCleanupService();

    // Start HTTP server
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
      console.log(`📊 API documentation: http://localhost:${port}/api/`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  
  // Stop cleanup service
  if (cleanupService) {
    cleanupService.stop();
    console.log('✅ Cleanup service stopped');
  }
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  
  // Stop cleanup service
  if (cleanupService) {
    cleanupService.stop();
    console.log('✅ Cleanup service stopped');
  }
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  }
  
  process.exit(0);
});

startServer();
