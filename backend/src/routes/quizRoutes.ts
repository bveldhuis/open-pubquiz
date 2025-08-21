import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Question } from '../entities/Question';
import { Team } from '../entities/Team';
import { Answer } from '../entities/Answer';
import { SessionEvent } from '../entities/SessionEvent';

const router = Router();

// Create session
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Session name is required' });
    }

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    
    // Generate unique session code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let sessionCode;
    let existingSession;
    do {
      sessionCode = generateCode();
      existingSession = await sessionRepository.findOne({ where: { code: sessionCode } });
    } while (existingSession);

    const session = sessionRepository.create({
      name,
      code: sessionCode,
      status: QuizSessionStatus.WAITING,
      current_round: 1
    });

    await sessionRepository.save(session);

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ 
      where: { code },
      relations: ['teams']
    });

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ 
      where: { code },
      relations: ['teams']
    });

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = status as QuizSessionStatus;
    await sessionRepository.save(session);

    res.json({ success: true, status: session.status });
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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify question exists and belongs to this session
    const questionRepository = AppDataSource.getRepository(Question);
    const question = await questionRepository.findOne({ 
      where: { id: questionId, quiz_session_id: session.id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    session.current_question_id = questionId;
    session.status = QuizSessionStatus.ACTIVE;
    await sessionRepository.save(session);

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = QuizSessionStatus.PAUSED;
    await sessionRepository.save(session);

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify question exists and belongs to this session
    const questionRepository = AppDataSource.getRepository(Question);
    const question = await questionRepository.findOne({ 
      where: { id: questionId, quiz_session_id: session.id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.current_round = session.current_round + 1;
    session.current_question_id = null;
    session.status = QuizSessionStatus.WAITING;
    await sessionRepository.save(session);

    res.json({ success: true, currentRound: session.current_round });
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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = QuizSessionStatus.FINISHED;
    await sessionRepository.save(session);

    res.json({ success: true });
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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const teamRepository = AppDataSource.getRepository(Team);
    const teams = await teamRepository.find({
      where: { quiz_session_id: session.id },
      order: { total_points: 'DESC' }
    });

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
    
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const eventRepository = AppDataSource.getRepository(SessionEvent);
    let whereClause: any = { quiz_session_id: session.id };
    
    // Filter by event type if specified
    if (eventType) {
      whereClause.event_type = eventType;
    }

    const events = await eventRepository.find({
      where: whereClause,
      order: { created_at: 'DESC' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      relations: ['team', 'question']
    });

    const totalCount = await eventRepository.count({ where: whereClause });

    res.json({ 
      events,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + events.length
      }
    });
  } catch (error) {
    console.error('Error getting session events:', error);
    res.status(500).json({ error: 'Failed to get session events' });
  }
  return;
});

export default router;
