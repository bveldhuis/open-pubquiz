import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Question, QuestionType } from '../entities/Question';
import { QuizSession } from '../entities/QuizSession';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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

    // Find session
    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code: sessionCode } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Validate question type specific fields
    if (type === QuestionType.MULTIPLE_CHOICE && (!options || !Array.isArray(options) || options.length < 2)) {
      return res.status(400).json({ error: 'Multiple choice questions require at least 2 options' });
    }

    if (type === QuestionType.SEQUENCE && (!sequenceItems || !Array.isArray(sequenceItems) || sequenceItems.length < 2)) {
      return res.status(400).json({ error: 'Sequence questions require at least 2 items' });
    }

    // Create question
    const questionRepository = AppDataSource.getRepository(Question);
    const question = questionRepository.create({
      id: uuidv4(),
      quiz_session_id: session.id,
      round_number: roundNumber,
      question_number: questionNumber,
      type,
      question_text: questionText,
      fun_fact: funFact || null,
      time_limit: timeLimit || null,
      points: points || 1,
      options: type === QuestionType.MULTIPLE_CHOICE ? options : null,
      correct_answer: correctAnswer || null,
      sequence_items: type === QuestionType.SEQUENCE ? sequenceItems : null
    });

    await questionRepository.save(question);

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
    const { round } = req.query;

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code: sessionCode } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const questionRepository = AppDataSource.getRepository(Question);
    let whereClause: any = { quiz_session_id: session.id };
    
    if (round) {
      whereClause.round_number = parseInt(round as string);
    }

    const questions = await questionRepository.find({
      where: whereClause,
      order: { round_number: 'ASC', question_number: 'ASC' }
    });

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

    const questionRepository = AppDataSource.getRepository(Question);
    const question = await questionRepository.findOne({
      where: { id },
      relations: ['quizSession']
    });

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
    const {
      questionText,
      funFact,
      timeLimit,
      points,
      options,
      correctAnswer,
      sequenceItems
    } = req.body;

    const questionRepository = AppDataSource.getRepository(Question);
    const question = await questionRepository.findOne({ where: { id } });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update fields
    const updateData: any = {};
    if (questionText !== undefined) updateData.question_text = questionText;
    if (funFact !== undefined) updateData.fun_fact = funFact;
    if (timeLimit !== undefined) updateData.time_limit = timeLimit;
    if (points !== undefined) updateData.points = points;
    if (options !== undefined) updateData.options = question.type === QuestionType.MULTIPLE_CHOICE ? options : null;
    if (correctAnswer !== undefined) updateData.correct_answer = correctAnswer;
    if (sequenceItems !== undefined) updateData.sequence_items = question.type === QuestionType.SEQUENCE ? sequenceItems : null;

    await questionRepository.update(id, updateData);

    const updatedQuestion = await questionRepository.findOne({ where: { id } });
    return res.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const questionRepository = AppDataSource.getRepository(Question);
    const question = await questionRepository.findOne({ where: { id } });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await questionRepository.remove(question);

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

    const sessionRepository = AppDataSource.getRepository(QuizSession);
    const session = await sessionRepository.findOne({ where: { code: sessionCode } });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const questionRepository = AppDataSource.getRepository(Question);
    const createdQuestions = [];

    for (const questionData of questions) {
      const {
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
      } = questionData;

      if (!roundNumber || !questionNumber || !type || !questionText) {
        continue; // Skip invalid questions
      }

      const question = questionRepository.create({
        id: uuidv4(),
        quiz_session_id: session.id,
        round_number: roundNumber,
        question_number: questionNumber,
        type,
        question_text: questionText,
        fun_fact: funFact || null,
        time_limit: timeLimit || null,
        points: points || 1,
        options: type === QuestionType.MULTIPLE_CHOICE ? options : null,
        correct_answer: correctAnswer || null,
        sequence_items: type === QuestionType.SEQUENCE ? sequenceItems : null
      });

      await questionRepository.save(question);
      createdQuestions.push(question);
    }

    return res.status(201).json({ questions: createdQuestions });
  } catch (error) {
    console.error('Error creating questions in bulk:', error);
    return res.status(500).json({ error: 'Failed to create questions' });
  }
});

export { router as questionRoutes };
