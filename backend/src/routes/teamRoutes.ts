import { Router } from 'express';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();

// Join session as team
router.post('/join', async (req, res) => {
  try {
    const { sessionCode, teamName } = req.body;

    if (!sessionCode || !teamName) {
      return res.status(400).json({ error: 'Session code and team name are required' });
    }

    const result = await sessionService.joinSession(sessionCode, teamName);

    return res.status(201).json({
      team: {
        id: result.team.id,
        name: result.team.name,
        totalPoints: result.team.total_points,
        joinedAt: result.team.joined_at
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

    const team = await teamService.getTeamById(id);

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

    await teamService.updateTeamPoints(id, points);

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

    const session = await sessionService.getSession(sessionCode, ['teams']);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Sort teams by points
    const teams = session.teams.sort((a: any, b: any) => b.total_points - a.total_points);

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

    await teamService.deleteTeam(id);

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

    await teamService.updateTeamActivity(id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating team activity:', error);
    return res.status(500).json({ error: 'Failed to update team activity' });
  }
});

export { router as teamRoutes };
