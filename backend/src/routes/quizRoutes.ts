import { Router } from 'express';
import { QuizSessionStatus } from '../entities/QuizSession';
import { EventType } from '../entities/SessionEvent';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();
const questionService = serviceFactory.createQuestionService(sessionService);

/**
 * @swagger
 * /quiz:
 *   post:
 *     summary: Create a new quiz session
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the quiz session
 *                 example: "Friday Night Quiz"
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Create session
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Session name is required' });
    }

    const session = await sessionService.createSession(name);
    res.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}:
 *   get:
 *     summary: Get session by code
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get session
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const session = await sessionService.getSession(code, ['teams']);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/status:
 *   get:
 *     summary: Get session status
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionStatus'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get session status
router.get('/:code/status', async (req, res) => {
  try {
    const { code } = req.params;
    
    const session = await sessionService.getSession(code, ['teams']);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      status: session.status,
      currentRound: session.current_round,
      currentQuestionId: session.current_question_id,
      teamCount: session.teams.length
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/status:
 *   patch:
 *     summary: Update session status
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [WAITING, ACTIVE, FINISHED]
 *                 description: New session status
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Session status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "ACTIVE"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Update session status
router.patch('/:code/status', async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body;
    
    await sessionService.updateSessionStatus(code, status as QuizSessionStatus);

    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/start-question:
 *   post:
 *     summary: Start a question in the session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the question to start
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Question started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Start question
router.post('/:code/start-question', async (req, res) => {
  try {
    const { code } = req.params;
    const { questionId } = req.body;
    
    await questionService.startQuestion(code, questionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error starting question:', error);
    res.status(500).json({ error: 'Failed to start question' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/end-question:
 *   post:
 *     summary: End the current question in the session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Question ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// End question
router.post('/:code/end-question', async (req, res) => {
  try {
    const { code } = req.params;
    
    await questionService.endQuestion(code);

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending question:', error);
    res.status(500).json({ error: 'Failed to end question' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/show-review:
 *   post:
 *     summary: Show review for a specific question
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the question to review
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Review shown successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Show review
router.post('/:code/show-review', async (req, res) => {
  try {
    const { code } = req.params;
    const { questionId } = req.body;
    
    // Verify session and question exist
    await sessionService.getSessionByCodeOrThrow(code);
    await questionService.getQuestionByIdOrThrow(questionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error showing review:', error);
    res.status(500).json({ error: 'Failed to show review' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/show-leaderboard:
 *   post:
 *     summary: Show leaderboard for the session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Leaderboard shown successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Show leaderboard
router.post('/:code/show-leaderboard', async (req, res) => {
  try {
    const { code } = req.params;
    
    await sessionService.getSessionByCodeOrThrow(code);

    res.json({ success: true });
  } catch (error) {
    console.error('Error showing leaderboard:', error);
    res.status(500).json({ error: 'Failed to show leaderboard' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/next-round:
 *   post:
 *     summary: Start the next round in the session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Next round started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 currentRound:
 *                   type: integer
 *                   minimum: 1
 *                   example: 2
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Next round
router.post('/:code/next-round', async (req, res) => {
  try {
    const { code } = req.params;
    
    const newRound = await sessionService.startNextRound(code);

    // Notify all clients in the session about the round change
    const io = req.app.get('io');
    if (io) {
      io.to(code).emit('round_started', {
        roundNumber: newRound
      });
    }

    res.json({ success: true, currentRound: newRound });
  } catch (error) {
    console.error('Error starting next round:', error);
    res.status(500).json({ error: 'Failed to start next round' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/end:
 *   post:
 *     summary: End the quiz session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// End session
router.post('/:code/end', async (req, res) => {
  try {
    const { code } = req.params;
    
    await sessionService.endSession(code);

    // Get final leaderboard
    const teams = await teamService.getLeaderboard(code);

    // Notify all clients in the session about the session ending
    const io = req.app.get('io');
    if (io) {
      io.to(code).emit('session_ended', {
        teams: teams
      });
    }

    res.json({ success: true, teams });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/leaderboard:
 *   get:
 *     summary: Get leaderboard for the session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Leaderboard'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get leaderboard
router.get('/:code/leaderboard', async (req, res) => {
  try {
    const { code } = req.params;
    const teams = await teamService.getLeaderboard(code);
    res.json({ teams });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
  return;
});

/**
 * @swagger
 * /quiz/{code}/events:
 *   get:
 *     summary: Get session events with pagination
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of events to skip
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [SESSION_CREATED, TEAM_JOINED, TEAM_LEFT, QUESTION_STARTED, QUESTION_ENDED, ANSWER_SUBMITTED, ROUND_STARTED, SESSION_ENDED]
 *         description: Filter events by type
 *     responses:
 *       200:
 *         description: Session events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SessionEvent'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       minimum: 0
 *                     limit:
 *                       type: integer
 *                       minimum: 1
 *                     offset:
 *                       type: integer
 *                       minimum: 0
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get session events
router.get('/:code/events', async (req, res) => {
  try {
    const { code } = req.params;
    const { limit = 50, offset = 0, eventType } = req.query;
    
    const { events, total } = await sessionService.getSessionEvents(code, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      eventType: eventType as EventType
    });

    res.json({ 
      events,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + events.length
      }
    });
  } catch (error) {
    console.error('Error getting session events:', error);
    res.status(500).json({ error: 'Failed to get session events' });
  }
  return;
});

/**
 * @swagger
 * /quiz/cleanup/stats:
 *   get:
 *     summary: Get cleanup statistics
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Cleanup statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   $ref: '#/components/schemas/CleanupStats'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Cleanup routes
router.get('/cleanup/stats', async (req, res) => {
  try {
    const stats = await sessionService.getCleanupStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({ error: 'Failed to get cleanup stats' });
  }
  return;
});

/**
 * @swagger
 * /quiz/cleanup/run:
 *   post:
 *     summary: Run cleanup of inactive sessions
 *     tags: [System]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inactiveHours:
 *                 type: integer
 *                 minimum: 1
 *                 default: 4
 *                 description: Number of hours of inactivity before cleanup
 *                 example: 4
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 result:
 *                   type: object
 *                   properties:
 *                     sessionsRemoved:
 *                       type: integer
 *                       minimum: 0
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/cleanup/run', async (req, res) => {
  try {
    const { inactiveHours = 4 } = req.body;
    const result = await sessionService.cleanupInactiveSessions(inactiveHours);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({ error: 'Failed to run cleanup' });
  }
  return;
});

export default router;
