import { Router } from 'express';
import { QuestionType } from '../entities/Question';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();
const questionService = serviceFactory.createQuestionService(sessionService);

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
      sequenceItems
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
      sequenceItems
    });

    return res.status(201).json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    return res.status(500).json({ error: 'Failed to create question' });
  }
});

// Get questions for session
router.get('/session/:sessionCode', async (req, res) => {
  try {
    const { sessionCode } = req.params;

    const questions = await questionService.getQuestionsForSession(sessionCode);

    return res.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

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
