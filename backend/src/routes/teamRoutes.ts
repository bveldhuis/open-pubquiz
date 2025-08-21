import { Router } from 'express';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();

/**
 * @swagger
 * /teams/join:
 *   post:
 *     summary: Join a session as a team
 *     tags: [Teams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionCode
 *               - teamName
 *             properties:
 *               sessionCode:
 *                 type: string
 *                 pattern: '^[A-Z0-9]{6}$'
 *                 description: 6-character session code
 *                 example: "ABC123"
 *               teamName:
 *                 type: string
 *                 description: Name of the team
 *                 example: "The Quiz Masters"
 *     responses:
 *       201:
 *         description: Team joined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     totalPoints:
 *                       type: integer
 *                       minimum: 0
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Team retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /teams/{id}/points:
 *   patch:
 *     summary: Update team points
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 0
 *                 description: New total points for the team
 *                 example: 150
 *     responses:
 *       200:
 *         description: Team points updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalPoints:
 *                   type: integer
 *                   minimum: 0
 *                   example: 150
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /teams/session/{sessionCode}:
 *   get:
 *     summary: Get all teams for a session
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: sessionCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /teams/{id}:
 *   delete:
 *     summary: Remove team from session
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Team removed successfully
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

/**
 * @swagger
 * /teams/{id}/activity:
 *   patch:
 *     summary: Update team activity timestamp
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Team activity updated successfully
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
