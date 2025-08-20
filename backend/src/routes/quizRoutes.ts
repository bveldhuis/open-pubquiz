import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Question, QuestionType } from '../entities/Question';
import { SessionEvent, EventType } from '../entities/SessionEvent';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

const router = Router();

// Generate unique session code
function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create new quiz session
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Session name is required' });
    }

    // Generate unique session code
    let sessionCode: string;
    let existingSession;
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    
    do {
      sessionCode = generateSessionCode();
      existingSession = await sessionRepository.findOne({ where: { code: sessionCode } });
    } while (existingSession);

    // Create session
    const session = sessionRepository.create({
      id: uuidv4(),
      code: sessionCode,
      name,
      status: QuizSessionStatus.WAITING
    });

    await sessionRepository.save(session);

    // Log session creation event
    const eventRepository = AppDataSource.getRepository(SessionEvent);
    await eventRepository.save({
      quiz_session_id: session.id,
      event_type: EventType.SESSION_CREATED,
      event_data: { sessionName: name }
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.FRONTEND_URL || 'http://localhost:4200'}/join?code=${sessionCode}`);

    return res.status(201).json({
      session: {
        id: session.id,
        code: session.code,
        name: session.name,
        status: session.status,
        qrCode: qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Error creating quiz session:', error);
    return res.status(500).json({ error: 'Failed to create quiz session' });
  }
});

// Get session by code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({
      where: { code },
      relations: ['teams', 'questions']
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
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

    return res.json({
      status: session.status,
      currentRound: session.current_round,
      currentQuestionId: session.current_question_id,
      teamCount: session.teams.length
    });
  } catch (error) {
    console.error('Error fetching session status:', error);
    return res.status(500).json({ error: 'Failed to fetch session status' });
  }
});

// Update session status
router.patch('/:code/status', async (req, res) => {
  try {
    const { code } = req.params;
    const { status } = req.body;

    if (!Object.values(QuizSessionStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await sessionRepository.update(session.id, { status });

    return res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating session status:', error);
    return res.status(500).json({ error: 'Failed to update session status' });
  }
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

    await sessionRepository.update(session.id, { status: QuizSessionStatus.FINISHED });

    // Log session end event
    const eventRepository = AppDataSource.getRepository(SessionEvent);
    await eventRepository.save({
      quiz_session_id: session.id,
      event_type: EventType.SESSION_ENDED
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    return res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session leaderboard
router.get('/:code/leaderboard', async (req, res) => {
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

    // Sort teams by points
    const teams = session.teams.sort((a, b) => b.total_points - a.total_points);

    return res.json({ teams });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get session events
router.get('/:code/events', async (req, res) => {
  try {
    const { code } = req.params;

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const eventRepository = AppDataSource.getRepository(SessionEvent);
    const events = await eventRepository.find({
      where: { quiz_session_id: session.id },
      order: { created_at: 'DESC' },
      take: 50
    });

    return res.json({ events });
  } catch (error) {
    console.error('Error fetching session events:', error);
    return res.status(500).json({ error: 'Failed to fetch session events' });
  }
});

export { router as quizRoutes };
