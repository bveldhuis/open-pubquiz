import { Router } from 'express';
import { QuestionType } from '../entities/Question';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();
const questionService = serviceFactory.createQuestionService(sessionService);

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionCode
 *               - roundNumber
 *               - questionNumber
 *               - type
 *               - questionText
 *             properties:
 *               sessionCode:
 *                 type: string
 *                 pattern: '^[A-Z0-9]{6}$'
 *                 description: 6-character session code
 *                 example: "ABC123"
 *               roundNumber:
 *                 type: integer
 *                 minimum: 1
 *                 description: Round number
 *                 example: 1
 *               questionNumber:
 *                 type: integer
 *                 minimum: 1
 *                 description: Question number within the round
 *                 example: 1
               *               type:
              *                 type: string
              *                 enum: [MULTIPLE_CHOICE, OPEN_TEXT, SEQUENCE, TRUE_FALSE, NUMERICAL, IMAGE, AUDIO, VIDEO]
              *                 description: Question type
              *                 example: "MULTIPLE_CHOICE"
 *               questionText:
 *                 type: string
 *                 description: The question text
 *                 example: "What is the capital of France?"
 *               funFact:
 *                 type: string
 *                 description: Optional fun fact about the answer
 *                 example: "Paris has been the capital since 987 CE"
 *               timeLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Time limit in seconds
 *                 example: 30
 *               points:
 *                 type: integer
 *                 minimum: 1
 *                 description: Points awarded for correct answer
 *                 example: 10
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Multiple choice options (required for MULTIPLE_CHOICE type)
 *                 example: ["London", "Paris", "Berlin", "Madrid"]
 *               correctAnswer:
 *                 type: string
 *                 description: Correct answer text
 *                 example: "Paris"
               *               sequenceItems:
              *                 type: array
              *                 items:
              *                   type: string
              *                 description: Sequence items to order (required for SEQUENCE type)
              *                 example: ["First", "Second", "Third", "Fourth"]
              *               mediaUrl:
              *                 type: string
              *                 format: uri
              *                 description: URL for media content (required for IMAGE, AUDIO, VIDEO types)
              *                 example: "https://example.com/image.jpg"
              *               numericalAnswer:
              *                 type: number
              *                 description: Correct numerical answer (required for NUMERICAL type)
              *                 example: 3.14159
              *               numericalTolerance:
              *                 type: number
              *                 description: Tolerance for numerical answers (optional)
              *                 example: 0.01
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Create question
router.post('/', async (req, res) => {
  try {
    const {
      sessionCode,
      roundNumber,
      questionNumber,
      type,
      questionText,
      funFact,
      timeLimit,
      points,
      options,
      correctAnswer,
      sequenceItems,
      mediaUrl,
      numericalAnswer,
      numericalTolerance
    } = req.body;

    if (!sessionCode || !roundNumber || !questionNumber || !type || !questionText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Object.values(QuestionType).includes(type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }

    // Validate question type specific fields
    if (type === QuestionType.MULTIPLE_CHOICE && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({ error: 'Multiple choice questions require at least 2 options' });
    }

    if (type === QuestionType.SEQUENCE && (!sequenceItems || !Array.isArray(sequenceItems) || sequenceItems.length < 2)) {
      return res.status(400).json({ error: 'Sequence questions require at least 2 items' });
    }

    if (type === QuestionType.TRUE_FALSE && !correctAnswer) {
      return res.status(400).json({ error: 'True/false questions require a correct answer (true or false)' });
    }

    if (type === QuestionType.NUMERICAL && numericalAnswer === undefined) {
      return res.status(400).json({ error: 'Numerical questions require a numerical answer' });
    }

    if ([QuestionType.IMAGE, QuestionType.AUDIO, QuestionType.VIDEO].includes(type) && !mediaUrl) {
      return res.status(400).json({ error: 'Media questions require a media URL' });
    }

    const question = await questionService.createQuestion({
      sessionCode,
      roundNumber,
      questionNumber,
      type,
      questionText,
      funFact,
      timeLimit,
      points,
      options,
      correctAnswer,
      sequenceItems,
      mediaUrl,
      numericalAnswer,
      numericalTolerance
    });

    return res.status(201).json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    return res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * @swagger
 * /questions/session/{sessionCode}:
 *   get:
 *     summary: Get questions for a session
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: sessionCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Z0-9]{6}$'
 *         description: 6-character session code
 *         example: "ABC123"
 *       - in: query
 *         name: round
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter questions by round number
 *         example: 1
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get questions for session
router.get('/session/:sessionCode', async (req, res) => {
  try {
    const { sessionCode } = req.params;
    const { round } = req.query;

    const questions = await questionService.getQuestionsForSession(sessionCode, round ? parseInt(round as string) : undefined);

    return res.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Get question by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await questionService.getQuestionById(id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json({ question });
  } catch (error) {
    console.error('Error fetching question:', error);
    return res.status(500).json({ error: 'Failed to fetch question' });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: Update question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *                 description: Updated question text
 *               funFact:
 *                 type: string
 *                 description: Updated fun fact
 *               timeLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Updated time limit in seconds
 *               points:
 *                 type: integer
 *                 minimum: 1
 *                 description: Updated points value
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated multiple choice options
 *               correctAnswer:
 *                 type: string
 *                 description: Updated correct answer
 *               sequenceItems:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated sequence items
 *     responses:
 *       200:
 *         description: Question updated successfully
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
// Update question
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await questionService.updateQuestion(id, updateData);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Delete question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Question deleted successfully
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
// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await questionService.deleteQuestion(id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Failed to delete question' });
  }
});

/**
 * @swagger
 * /questions/bulk:
 *   post:
 *     summary: Create multiple questions at once
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionCode
 *               - questions
 *             properties:
 *               sessionCode:
 *                 type: string
 *                 pattern: '^[A-Z0-9]{6}$'
 *                 description: 6-character session code
 *                 example: "ABC123"
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - roundNumber
 *                     - questionNumber
 *                     - type
 *                     - questionText
 *                   properties:
 *                     roundNumber:
 *                       type: integer
 *                       minimum: 1
 *                       description: Round number
 *                       example: 1
 *                     questionNumber:
 *                       type: integer
 *                       minimum: 1
 *                       description: Question number within the round
 *                       example: 1
 *                     type:
 *                       type: string
 *                       enum: [MULTIPLE_CHOICE, OPEN_TEXT, SEQUENCE]
 *                       description: Question type
 *                       example: "MULTIPLE_CHOICE"
 *                     questionText:
 *                       type: string
 *                       description: The question text
 *                       example: "What is the capital of France?"
 *                     funFact:
 *                       type: string
 *                       description: Optional fun fact about the answer
 *                     timeLimit:
 *                       type: integer
 *                       minimum: 1
 *                       description: Time limit in seconds
 *                     points:
 *                       type: integer
 *                       minimum: 1
 *                       description: Points awarded for correct answer
 *                       example: 10
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Multiple choice options
 *                     correctAnswer:
 *                       type: string
 *                       description: Correct answer text
 *                     sequenceItems:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Sequence items to order
 *     responses:
 *       201:
 *         description: Questions created successfully
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
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Bulk create questions
router.post('/bulk', async (req, res) => {
  try {
    const { sessionCode, questions } = req.body;

    if (!sessionCode || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Session code and questions array are required' });
    }

    const createdQuestions = await questionService.bulkCreateQuestions(sessionCode, questions);

    return res.status(201).json({ questions: createdQuestions });
  } catch (error) {
    console.error('Error creating questions:', error);
    return res.status(500).json({ error: 'Failed to create questions' });
  }
});

export { router as questionRoutes };
