import { Router } from 'express';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();
const questionService = serviceFactory.createQuestionService(sessionService);
const answerService = serviceFactory.createAnswerService(questionService, teamService);

/**
 * @swagger
 * /answers:
 *   post:
 *     summary: Submit an answer for a question
 *     tags: [Answers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - teamId
 *               - answer
 *             properties:
 *               questionId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the question being answered
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the team submitting the answer
 *                 example: "456e7890-e89b-12d3-a456-426614174000"
 *               answer:
 *                 oneOf:
 *                   - type: string
 *                     description: Text answer for open text questions
 *                     example: "Paris"
 *                   - type: integer
 *                     description: Option index for multiple choice questions (0-based)
 *                     example: 1
 *                   - type: array
 *                     items:
 *                       type: integer
 *                     description: Sequence order for sequence questions
 *                     example: [2, 0, 1, 3]
 *     responses:
 *       201:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     questionId:
 *                       type: string
 *                       format: uuid
 *                     teamId:
 *                       type: string
 *                       format: uuid
 *                     answerText:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                     pointsAwarded:
 *                       type: integer
 *                       minimum: 0
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Submit answer
router.post('/', async (req, res) => {
  try {
    const { questionId, teamId, answer } = req.body;

    if (!questionId || !teamId || answer === undefined) {
      return res.status(400).json({ error: 'Question ID, team ID, and answer are required' });
    }

    const result = await answerService.submitAnswer(questionId, teamId, answer);

    return res.status(201).json({
      answer: {
        id: result.answer.id,
        questionId: result.answer.question_id,
        teamId: result.answer.team_id,
        answerText: result.answer.answer_text,
        isCorrect: result.answer.is_correct,
        pointsAwarded: result.answer.points_awarded,
        submittedAt: result.answer.submitted_at
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({ error: 'Failed to submit answer' });
  }
});

/**
 * @swagger
 * /answers/question/{questionId}:
 *   get:
 *     summary: Get all answers for a specific question
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Answer'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get answers for question
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const answers = await answerService.getAnswersForQuestion(questionId);

    return res.json({ answers });
  } catch (error) {
    console.error('Error fetching answers:', error);
    return res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

/**
 * @swagger
 * /answers/team/{teamId}:
 *   get:
 *     summary: Get all answers for a specific team
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *         example: "456e7890-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Team answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Answer'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get answers for team
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    const answers = await answerService.getAnswersForTeam(teamId);

    return res.json({ answers });
  } catch (error) {
    console.error('Error fetching team answers:', error);
    return res.status(500).json({ error: 'Failed to fetch team answers' });
  }
});

/**
 * @swagger
 * /answers/{id}:
 *   get:
 *     summary: Get answer by ID
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Answer ID
 *         example: "789e0123-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Answer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   $ref: '#/components/schemas/Answer'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get answer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const answer = await answerService.getAnswerById(id);

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    return res.json({ answer });
  } catch (error) {
    console.error('Error fetching answer:', error);
    return res.status(500).json({ error: 'Failed to fetch answer' });
  }
});

/**
 * @swagger
 * /answers/{id}/score:
 *   patch:
 *     summary: Manually score an answer
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Answer ID
 *         example: "789e0123-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - isCorrect
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 0
 *                 description: Points to award for this answer
 *                 example: 10
 *               isCorrect:
 *                 type: boolean
 *                 description: Whether the answer is correct
 *                 example: true
 *     responses:
 *       200:
 *         description: Answer scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Score answer manually
router.patch('/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { points, isCorrect } = req.body;

    if (points === undefined || isCorrect === undefined) {
      return res.status(400).json({ error: 'Points and isCorrect are required' });
    }

    await answerService.scoreAnswer(id, points, isCorrect);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error scoring answer:', error);
    return res.status(500).json({ error: 'Failed to score answer' });
  }
});

/**
 * @swagger
 * /answers/{id}:
 *   delete:
 *     summary: Delete answer by ID
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Answer ID
 *         example: "789e0123-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Answer deleted successfully
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
// Delete answer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await answerService.deleteAnswer(id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting answer:', error);
    return res.status(500).json({ error: 'Failed to delete answer' });
  }
});

export { router as answerRoutes };
