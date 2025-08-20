import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Answer } from '../entities/Answer';
import { Question, QuestionType } from '../entities/Question';
import { Team } from '../entities/Team';
import { SequenceAnswer } from '../entities/SequenceAnswer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Submit answer
router.post('/', async (req, res) => {
  try {
    const { questionId, teamId, answer } = req.body;

    if (!questionId || !teamId || answer === undefined) {
      return res.status(400).json({ error: 'Question ID, team ID, and answer are required' });
    }

    // Check if answer already exists
    const answerRepository = AppDataSource.getRepository(Answer);
    const existingAnswer = await answerRepository.findOne({
      where: { question_id: questionId, team_id: teamId }
    });

    if (existingAnswer) {
      return res.status(409).json({ error: 'Answer already submitted for this question' });
    }

    // Validate question and team exist
    const questionRepository = AppDataSource.getRepository(Question);
    const teamRepository = AppDataSource.getRepository(Team);

    const question = await questionRepository.findOne({ where: { id: questionId } });
    const team = await teamRepository.findOne({ where: { id: teamId } });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Process answer based on question type
    let answerText: string;
    let isCorrect: boolean | null = null;
    let pointsAwarded = 0;

    if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
      answerText = answer.join('|');
    } else if (typeof answer === 'string') {
      answerText = answer;
    } else {
      return res.status(400).json({ error: 'Invalid answer format' });
    }

    // Auto-score multiple choice questions
    if (question.type === QuestionType.MULTIPLE_CHOICE && question.correct_answer) {
      console.log('🔍 Multiple choice scoring:');
      console.log('  - Submitted answer:', `"${answerText}"`);
      console.log('  - Correct answer:', `"${question.correct_answer}"`);
      console.log('  - Submitted length:', answerText.length);
      console.log('  - Correct length:', question.correct_answer.length);
      console.log('  - Submitted char codes:', Array.from(answerText).map(c => c.charCodeAt(0)));
      console.log('  - Correct char codes:', Array.from(question.correct_answer).map(c => c.charCodeAt(0)));
      console.log('  - Submitted (normalized):', `"${answerText.toLowerCase().trim()}"`);
      console.log('  - Correct (normalized):', `"${question.correct_answer.toLowerCase().trim()}"`);
      
      isCorrect = answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      pointsAwarded = isCorrect ? question.points : 0;
      
      console.log('  - Result:', isCorrect ? 'CORRECT' : 'INCORRECT');
      console.log('  - Points awarded:', pointsAwarded);
    }
    
    // Auto-score sequence questions
    if (question.type === QuestionType.SEQUENCE && question.sequence_items && Array.isArray(answer)) {
      console.log('🔍 Sequence scoring:');
      console.log('  - Correct sequence:', question.sequence_items);
      console.log('  - Submitted sequence:', answer);
      
      const correctSequence = question.sequence_items;
      const submittedSequence = answer;
      
      // Check if all items are in correct order
      let correctCount = 0;
      for (let i = 0; i < Math.min(correctSequence.length, submittedSequence.length); i++) {
        if (correctSequence[i] === submittedSequence[i]) {
          correctCount++;
        }
      }
      
      console.log('  - Correct items:', correctCount, 'out of', correctSequence.length);
      
      // Full points if all correct, 1 point if only 1 wrong, 0 points otherwise
      if (correctCount === correctSequence.length) {
        isCorrect = true;
        pointsAwarded = question.points;
        console.log('  - Result: PERFECT (all correct)');
      } else if (correctCount === correctSequence.length - 1) {
        isCorrect = true;
        pointsAwarded = 1;
        console.log('  - Result: PARTIAL (1 wrong)');
      } else {
        isCorrect = false;
        pointsAwarded = 0;
        console.log('  - Result: INCORRECT');
      }
      
      console.log('  - Points awarded:', pointsAwarded);
    }
    
    // Open text questions are not auto-scored (isCorrect remains null)
    if (question.type === QuestionType.OPEN_TEXT) {
      console.log('🔍 Open text question - manual scoring required');
    }

    // Create answer
    const newAnswer = answerRepository.create({
      id: uuidv4(),
      question_id: questionId,
      team_id: teamId,
      answer_text: answerText,
      is_correct: isCorrect,
      points_awarded: pointsAwarded
    });

    await answerRepository.save(newAnswer);

    // Create sequence answers if needed
    if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
      const sequenceAnswerRepository = AppDataSource.getRepository(SequenceAnswer);
      for (let i = 0; i < answer.length; i++) {
        const sequenceAnswer = sequenceAnswerRepository.create({
          id: uuidv4(),
          answer_id: newAnswer.id,
          item_text: answer[i],
          position: i
        });
        await sequenceAnswerRepository.save(sequenceAnswer);
      }
    }

    // Update team points if auto-scored
    if (isCorrect !== null) {
      await teamRepository.update(teamId, {
        total_points: team.total_points + pointsAwarded
      });
    }

    return res.status(201).json({
      answer: {
        id: newAnswer.id,
        questionId: newAnswer.question_id,
        teamId: newAnswer.team_id,
        answerText: newAnswer.answer_text,
        isCorrect: newAnswer.is_correct,
        pointsAwarded: newAnswer.points_awarded,
        submittedAt: newAnswer.submitted_at
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

    const answerRepository = AppDataSource.getRepository(Answer);
    const answers = await answerRepository.find({
      where: { question_id: questionId },
      relations: ['team', 'sequenceAnswers'],
      order: { submitted_at: 'ASC' }
    });

    res.json({ answers });
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// Get answers for team
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    const answerRepository = AppDataSource.getRepository(Answer);
    const answers = await answerRepository.find({
      where: { team_id: teamId },
      relations: ['question', 'sequenceAnswers'],
      order: { submitted_at: 'ASC' }
    });

    res.json({ answers });
  } catch (error) {
    console.error('Error fetching team answers:', error);
    res.status(500).json({ error: 'Failed to fetch team answers' });
  }
});

// Score answer (for manual scoring)
router.patch('/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { isCorrect, pointsAwarded } = req.body;

    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ error: 'isCorrect must be a boolean' });
    }

    if (typeof pointsAwarded !== 'number' || pointsAwarded < 0) {
      return res.status(400).json({ error: 'pointsAwarded must be a non-negative number' });
    }

    const answerRepository = AppDataSource.getRepository(Answer);
    const answer = await answerRepository.findOne({
      where: { id },
      relations: ['team', 'question']
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Update answer
    await answerRepository.update(id, {
      is_correct: isCorrect,
      points_awarded: pointsAwarded
    });

    // Update team points
    const teamRepository = AppDataSource.getRepository(Team);
    const currentPoints = answer.team.total_points;
    const pointsDifference = pointsAwarded - (answer.points_awarded || 0);
    
    await teamRepository.update(answer.team.id, {
      total_points: currentPoints + pointsDifference
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error scoring answer:', error);
    return res.status(500).json({ error: 'Failed to score answer' });
  }
});

// Get answer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const answerRepository = AppDataSource.getRepository(Answer);
    const answer = await answerRepository.findOne({
      where: { id },
      relations: ['team', 'question', 'sequenceAnswers']
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    return res.json({ answer });
  } catch (error) {
    console.error('Error fetching answer:', error);
    return res.status(500).json({ error: 'Failed to fetch answer' });
  }
});

// Delete answer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const answerRepository = AppDataSource.getRepository(Answer);
    const answer = await answerRepository.findOne({
      where: { id },
      relations: ['team']
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Remove points from team if answer was scored
    if (answer.points_awarded > 0) {
      const teamRepository = AppDataSource.getRepository(Team);
      await teamRepository.update(answer.team.id, {
        total_points: answer.team.total_points - answer.points_awarded
      });
    }

    await answerRepository.remove(answer);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting answer:', error);
    return res.status(500).json({ error: 'Failed to delete answer' });
  }
});

export { router as answerRoutes };
