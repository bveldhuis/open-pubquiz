import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Theme } from '../entities/Theme';
import { QuestionSet } from '../entities/QuestionSet';
import { QuestionType } from '../entities/Question';
import { Difficulty } from '../entities/QuestionSet';
import { apiKeyAuth, requirePermission, AuthenticatedRequest } from '../middleware/apiKeyAuth';

const router = Router();

// Apply API key authentication to all admin routes
router.use(apiKeyAuth);

/**
 * @swagger
 * /admin/themes:
 *   get:
 *     summary: Get all themes
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/themes', requirePermission('themes:read'), async (req, res) => {
  try {
    const themeRepository = AppDataSource.getRepository(Theme);
    const themes = await themeRepository.find({
      order: { name: 'ASC' }
    });

    return res.json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

/**
 * @swagger
 * /admin/themes:
 *   post:
 *     summary: Create a new theme
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
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
 *                 description: Theme name
 *                 example: "General Knowledge"
 *               description:
 *                 type: string
 *                 description: Theme description
 *                 example: "General knowledge questions covering various topics"
 *     responses:
 *       201:
 *         description: Theme created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   $ref: '#/components/schemas/Theme'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/themes', requirePermission('themes:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Theme name is required' });
    }

    const themeRepository = AppDataSource.getRepository(Theme);
    
    // Check if theme already exists
    const existingTheme = await themeRepository.findOne({
      where: { name }
    });

    if (existingTheme) {
      return res.status(400).json({ error: 'Theme with this name already exists' });
    }

    const theme = themeRepository.create({
      name,
      description,
      is_active: true
    });

    const savedTheme = await themeRepository.save(theme);

    return res.status(201).json({ theme: savedTheme });
  } catch (error) {
    console.error('Error creating theme:', error);
    return res.status(500).json({ error: 'Failed to create theme' });
  }
});

/**
 * @swagger
 * /admin/themes/{id}:
 *   put:
 *     summary: Update a theme
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated theme name
 *               description:
 *                 type: string
 *                 description: Updated theme description
 *               is_active:
 *                 type: boolean
 *                 description: Whether the theme is active
 *     responses:
 *       200:
 *         description: Theme updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   $ref: '#/components/schemas/Theme'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/themes/:id', requirePermission('themes:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const themeRepository = AppDataSource.getRepository(Theme);
    const theme = await themeRepository.findOne({
      where: { id }
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    if (name !== undefined) theme.name = name;
    if (description !== undefined) theme.description = description;
    if (is_active !== undefined) theme.is_active = is_active;

    const updatedTheme = await themeRepository.save(theme);

    return res.json({ theme: updatedTheme });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ error: 'Failed to update theme' });
  }
});

/**
 * @swagger
 * /admin/themes/{id}/questions:
 *   get:
 *     summary: Get questions for a theme
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [multiple_choice, open_text, sequence, true_false, numerical, image, audio, video]
 *         description: Filter by question type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
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
 *                     $ref: '#/components/schemas/QuestionSet'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/themes/:id/questions', requirePermission('questions:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, difficulty } = req.query;

    const questionSetRepository = AppDataSource.getRepository(QuestionSet);
    
    const whereClause: any = {
      theme_id: id,
      is_active: true
    };

    if (type) {
      whereClause.type = type;
    }

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    const questions = await questionSetRepository.find({
      where: whereClause,
      order: { created_at: 'DESC' }
    });

    return res.json({ questions });
  } catch (error) {
    console.error('Error fetching theme questions:', error);
    return res.status(500).json({ error: 'Failed to fetch theme questions' });
  }
});

/**
 * @swagger
 * /admin/themes/{id}/questions:
 *   post:
 *     summary: Add questions to a theme
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questions
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - question_text
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [multiple_choice, open_text, sequence, true_false, numerical, image, audio, video]
 *                     question_text:
 *                       type: string
 *                     fun_fact:
 *                       type: string
 *                     time_limit:
 *                       type: integer
 *                     points:
 *                       type: integer
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     correct_answer:
 *                       type: string
 *                     sequence_items:
 *                       type: array
 *                       items:
 *                         type: string
 *                     media_url:
 *                       type: string
 *                     numerical_answer:
 *                       type: number
 *                     numerical_tolerance:
 *                       type: number
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *     responses:
 *       201:
 *         description: Questions added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionSet'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/themes/:id/questions', requirePermission('questions:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required and must not be empty' });
    }

    // Verify theme exists
    const themeRepository = AppDataSource.getRepository(Theme);
    const theme = await themeRepository.findOne({
      where: { id }
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const questionSetRepository = AppDataSource.getRepository(QuestionSet);
    const createdQuestions = [];

    for (const questionData of questions) {
      // Validate required fields
      if (!questionData.type || !questionData.question_text) {
        return res.status(400).json({ error: 'Type and question_text are required for all questions' });
      }

      if (!Object.values(QuestionType).includes(questionData.type)) {
        return res.status(400).json({ error: `Invalid question type: ${questionData.type}` });
      }

      // Validate question type specific fields
      if (questionData.type === QuestionType.MULTIPLE_CHOICE && (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length < 2)) {
        return res.status(400).json({ error: 'Multiple choice questions require at least 2 options' });
      }

      if (questionData.type === QuestionType.SEQUENCE && (!questionData.sequence_items || !Array.isArray(questionData.sequence_items) || questionData.sequence_items.length < 2)) {
        return res.status(400).json({ error: 'Sequence questions require at least 2 items' });
      }

      if (questionData.type === QuestionType.TRUE_FALSE && !questionData.correct_answer) {
        return res.status(400).json({ error: 'True/false questions require a correct answer' });
      }

      if (questionData.type === QuestionType.NUMERICAL && questionData.numerical_answer === undefined) {
        return res.status(400).json({ error: 'Numerical questions require a numerical answer' });
      }

      if ([QuestionType.IMAGE, QuestionType.AUDIO, QuestionType.VIDEO].includes(questionData.type) && !questionData.media_url) {
        return res.status(400).json({ error: 'Media questions require a media URL' });
      }

      const questionSet = questionSetRepository.create({
        theme_id: id,
        type: questionData.type,
        question_text: questionData.question_text,
        fun_fact: questionData.fun_fact,
        time_limit: questionData.time_limit,
        points: questionData.points || 1,
        options: questionData.options,
        correct_answer: questionData.correct_answer,
        sequence_items: questionData.sequence_items,
        media_url: questionData.media_url,
        numerical_answer: questionData.numerical_answer,
        numerical_tolerance: questionData.numerical_tolerance,
        difficulty: questionData.difficulty || Difficulty.MEDIUM,
        is_active: true
      });

      const savedQuestion = await questionSetRepository.save(questionSet);
      createdQuestions.push(savedQuestion);
    }

    return res.status(201).json({ questions: createdQuestions });
  } catch (error) {
    console.error('Error creating questions:', error);
    return res.status(500).json({ error: 'Failed to create questions' });
  }
});

/**
 * @swagger
 * /admin/themes/{themeId}/questions/{questionId}:
 *   put:
 *     summary: Update a question in a theme
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_text:
 *                 type: string
 *               fun_fact:
 *                 type: string
 *               time_limit:
 *                 type: integer
 *               points:
 *                 type: integer
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correct_answer:
 *                 type: string
 *               sequence_items:
 *                 type: array
 *                 items:
 *                   type: string
 *               media_url:
 *                 type: string
 *               numerical_answer:
 *                 type: number
 *               numerical_tolerance:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 question:
 *                   $ref: '#/components/schemas/QuestionSet'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/themes/:themeId/questions/:questionId', requirePermission('questions:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const { themeId, questionId } = req.params;
    const updateData = req.body;

    const questionSetRepository = AppDataSource.getRepository(QuestionSet);
    const question = await questionSetRepository.findOne({
      where: {
        id: questionId,
        theme_id: themeId
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update fields
    Object.assign(question, updateData);

    const updatedQuestion = await questionSetRepository.save(question);

    return res.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * @swagger
 * /admin/themes/{themeId}/questions/{questionId}:
 *   delete:
 *     summary: Delete a question from a theme
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question ID
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/themes/:themeId/questions/:questionId', requirePermission('questions:write'), async (req, res) => {
  try {
    const { themeId, questionId } = req.params;

    const questionSetRepository = AppDataSource.getRepository(QuestionSet);
    const question = await questionSetRepository.findOne({
      where: {
        id: questionId,
        theme_id: themeId
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await questionSetRepository.remove(question);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Failed to delete question' });
  }
});

/**
 * @swagger
 * /admin/themes/{id}/stats:
 *   get:
 *     summary: Get theme statistics
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Theme ID
 *     responses:
 *       200:
 *         description: Theme statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_questions:
 *                       type: integer
 *                     questions_by_type:
 *                       type: object
 *                     questions_by_difficulty:
 *                       type: object
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/themes/:id/stats', requirePermission('themes:read'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify theme exists
    const themeRepository = AppDataSource.getRepository(Theme);
    const theme = await themeRepository.findOne({
      where: { id }
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const questionSetRepository = AppDataSource.getRepository(QuestionSet);
    
    // Get total questions
    const totalQuestions = await questionSetRepository.count({
      where: {
        theme_id: id,
        is_active: true
      }
    });

    // Get questions by type
    const questionsByType = await questionSetRepository
      .createQueryBuilder('qs')
      .select('qs.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('qs.theme_id = :themeId', { themeId: id })
      .andWhere('qs.is_active = :isActive', { isActive: true })
      .groupBy('qs.type')
      .getRawMany();

    // Get questions by difficulty
    const questionsByDifficulty = await questionSetRepository
      .createQueryBuilder('qs')
      .select('qs.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .where('qs.theme_id = :themeId', { themeId: id })
      .andWhere('qs.is_active = :isActive', { isActive: true })
      .groupBy('qs.difficulty')
      .getRawMany();

    const stats = {
      total_questions: totalQuestions,
      questions_by_type: questionsByType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
      questions_by_difficulty: questionsByDifficulty.reduce((acc, item) => {
        acc[item.difficulty] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>)
    };

    return res.json({ stats });
  } catch (error) {
    console.error('Error fetching theme stats:', error);
    return res.status(500).json({ error: 'Failed to fetch theme statistics' });
  }
});

export { router as adminRoutes };
