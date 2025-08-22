import { Router } from 'express';
import { SessionConfigurationService } from '../services/SessionConfigurationService';

const router = Router();
const sessionConfigService = new SessionConfigurationService();

/**
 * @swagger
 * /session-config/themes:
 *   get:
 *     summary: Get available themes for session configuration
 *     tags: [Session Configuration]
 *     responses:
 *       200:
 *         description: Themes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 themes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Theme'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/themes', async (req, res) => {
  try {
    const themes = await sessionConfigService.getAvailableThemes();
    return res.json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

/**
 * @swagger
 * /session-config/themes/{themeId}/question-counts:
 *   get:
 *     summary: Get question counts by type for a theme
 *     tags: [Session Configuration]
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *     responses:
 *       200:
 *         description: Question counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questionCounts:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/themes/:themeId/question-counts', async (req, res) => {
  try {
    const { themeId } = req.params;
    const questionCounts = await sessionConfigService.getThemeQuestionCounts(themeId);
    return res.json({ questionCounts });
  } catch (error) {
    console.error('Error fetching theme question counts:', error);
    return res.status(500).json({ error: 'Failed to fetch theme question counts' });
  }
});

/**
 * @swagger
 * /session-config/configure:
 *   post:
 *     summary: Configure a quiz session with themes and question types
 *     tags: [Session Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionCode
 *               - totalRounds
 *               - roundConfigurations
 *             properties:
 *               sessionCode:
 *                 type: string
 *                 pattern: '^[A-Z0-9]{6}$'
 *                 description: 6-character session code
 *                 example: "ABC123"
 *               totalRounds:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total number of rounds
 *                 example: 3
 *               roundConfigurations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - roundNumber
 *                     - themeId
 *                     - questionTypes
 *                   properties:
 *                     roundNumber:
 *                       type: integer
 *                       minimum: 1
 *                       description: Round number
 *                       example: 1
 *                     themeId:
 *                       type: string
 *                       format: uuid
 *                       description: Theme ID for this round
 *                     questionTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - type
 *                           - enabled
 *                           - questionCount
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [multiple_choice, open_text, sequence, true_false, numerical, image, audio, video]
 *                             description: Question type
 *                           enabled:
 *                             type: boolean
 *                             description: Whether this question type is enabled
 *                           questionCount:
 *                             type: integer
 *                             minimum: 0
 *                             description: Number of questions of this type
 *     responses:
 *       201:
 *         description: Session configured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configuration:
 *                   $ref: '#/components/schemas/SessionConfiguration'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/configure', async (req, res) => {
  try {
    const { sessionCode, totalRounds, roundConfigurations } = req.body;

    if (!sessionCode || !totalRounds || !roundConfigurations) {
      return res.status(400).json({ error: 'Session code, total rounds, and round configurations are required' });
    }

    if (!Array.isArray(roundConfigurations) || roundConfigurations.length === 0) {
      return res.status(400).json({ error: 'Round configurations must be a non-empty array' });
    }

    if (roundConfigurations.length !== totalRounds) {
      return res.status(400).json({ error: 'Number of round configurations must match total rounds' });
    }

    const configuration = await sessionConfigService.createSessionConfiguration({
      sessionCode,
      totalRounds,
      roundConfigurations
    });

    return res.status(201).json({ configuration });
  } catch (error) {
    console.error('Error configuring session:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to configure session' });
  }
});

/**
 * @swagger
 * /session-config/{sessionCode}/generate-questions/{roundNumber}:
 *   post:
 *     summary: Generate questions for a specific round based on configuration
 *     tags: [Session Configuration]
 *     parameters:
 *       - in: path
 *         name: sessionCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *       - in: path
 *         name: roundNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Round number
 *         example: 1
 *     responses:
 *       200:
 *         description: Questions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:sessionCode/generate-questions/:roundNumber', async (req, res) => {
  try {
    const { sessionCode, roundNumber } = req.params;
    const roundNum = parseInt(roundNumber);

    if (isNaN(roundNum) || roundNum < 1) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const questions = await sessionConfigService.generateQuestionsForRound(sessionCode, roundNum);

    return res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
});

/**
 * @swagger
 * /session-config/{sessionCode}:
 *   get:
 *     summary: Get session configuration
 *     tags: [Session Configuration]
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
 *         description: Session configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configuration:
 *                   $ref: '#/components/schemas/SessionConfiguration'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:sessionCode', async (req, res) => {
  try {
    const { sessionCode } = req.params;
    const configuration = await sessionConfigService.getSessionConfiguration(sessionCode);

    if (!configuration) {
      return res.status(404).json({ error: 'Session configuration not found' });
    }

    return res.json({ configuration });
  } catch (error) {
    console.error('Error fetching session configuration:', error);
    return res.status(500).json({ error: 'Failed to fetch session configuration' });
  }
});

export { router as sessionConfigRoutes };
