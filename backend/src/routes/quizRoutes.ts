import { Router } from 'express';
import { QuizSessionStatus } from '../entities/QuizSession';
import { EventType } from '../entities/SessionEvent';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();
const questionService = serviceFactory.createQuestionService(sessionService);

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
