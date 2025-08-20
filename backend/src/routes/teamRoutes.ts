import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Team } from '../entities/Team';
import { QuizSession } from '../entities/QuizSession';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Join session as team
router.post('/join', async (req, res) => {
  try {
    const { sessionCode, teamName } = req.body;

    if (!sessionCode || !teamName) {
      return res.status(400).json({ error: 'Session code and team name are required' });
    }

    // Find session
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({
      where: { code: sessionCode },
      relations: ['teams']
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if team name already exists
    const existingTeam = session.teams.find(team => team.name === teamName);
    if (existingTeam) {
      return res.status(409).json({ error: 'Team name already exists in this session' });
    }

    // Create new team
    const teamRepository = AppDataSource.getRepository(Team);
    const team = teamRepository.create({
      id: uuidv4(),
      quiz_session_id: session.id,
      name: teamName,
      total_points: 0
    });

    await teamRepository.save(team);

    return res.status(201).json({
      team: {
        id: team.id,
        name: team.name,
        totalPoints: team.total_points,
        joinedAt: team.joined_at
      }
    });
  } catch (error) {
    console.error('Error joining team:', error);
    return res.status(500).json({ error: 'Failed to join team' });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const teamRepository = AppDataSource.getRepository(Team);
    const team = await teamRepository.findOne({
      where: { id },
      relations: ['quizSession', 'answers']
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    return res.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    return res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update team points
router.patch('/:id/points', async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (typeof points !== 'number') {
      return res.status(400).json({ error: 'Points must be a number' });
    }

    const teamRepository = AppDataSource.getRepository(Team);
    const team = await teamRepository.findOne({ where: { id } });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await teamRepository.update(id, { total_points: points });

    return res.json({ success: true, totalPoints: points });
  } catch (error) {
    console.error('Error updating team points:', error);
    return res.status(500).json({ error: 'Failed to update team points' });
  }
});

// Get teams for session
router.get('/session/:sessionCode', async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({
      where: { code: sessionCode },
      relations: ['teams']
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Sort teams by points
    const teams = session.teams.sort((a, b) => b.total_points - a.total_points);

    return res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Remove team from session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const teamRepository = AppDataSource.getRepository(Team);
    const team = await teamRepository.findOne({ where: { id } });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await teamRepository.remove(team);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing team:', error);
    return res.status(500).json({ error: 'Failed to remove team' });
  }
});

// Update team activity
router.patch('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;

    const teamRepository = AppDataSource.getRepository(Team);
    const team = await teamRepository.findOne({ where: { id } });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Update last activity timestamp
    await teamRepository.update(id, { last_activity: new Date() });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating team activity:', error);
    return res.status(500).json({ error: 'Failed to update team activity' });
  }
});

export { router as teamRoutes };
