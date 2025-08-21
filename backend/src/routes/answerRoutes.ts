import { Router } from 'express';
import { ServiceFactory } from '../services/ServiceFactory';

const router = Router();
const serviceFactory = ServiceFactory.getInstance();
const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
const teamService = serviceFactory.createTeamService();
const questionService = serviceFactory.createQuestionService(sessionService);
const answerService = serviceFactory.createAnswerService(questionService, teamService);

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
