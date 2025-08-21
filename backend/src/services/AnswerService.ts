import { AppDataSource } from '../config/database';
import { Answer } from '../entities/Answer';
import { SequenceAnswer } from '../entities/SequenceAnswer';
import { Question, QuestionType } from '../entities/Question';
import { IAnswerService, SubmitAnswerResult } from './interfaces/IAnswerService';
import { IQuestionService } from './interfaces/IQuestionService';
import { ITeamService } from './interfaces/ITeamService';

export class AnswerService implements IAnswerService {
  private answerRepository = AppDataSource.getRepository(Answer);
  private sequenceAnswerRepository = AppDataSource.getRepository(SequenceAnswer);

  constructor(
    private questionService: IQuestionService,
    private teamService: ITeamService
  ) {}

  /**
   * Submit an answer for a question
   */
  async submitAnswer(questionId: string, teamId: string, answer: string | string[]): Promise<SubmitAnswerResult> {
    // Validate question and team exist
    const question = await this.questionService.getQuestionByIdOrThrow(questionId);
    const team = await this.teamService.getTeamByIdOrThrow(teamId);

    // Check if answer already exists
    const existingAnswer = await this.answerRepository.findOne({
      where: { question_id: questionId, team_id: teamId }
    });

    if (existingAnswer) {
      throw new Error('Answer already submitted for this question');
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
      throw new Error('Invalid answer format');
    }

    // Auto-score multiple choice questions
    if (question.type === QuestionType.MULTIPLE_CHOICE && question.correct_answer) {
      isCorrect = answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      pointsAwarded = isCorrect ? question.points : 0;
    }
    
    // Auto-score sequence questions
    if (question.type === QuestionType.SEQUENCE && question.sequence_items && Array.isArray(answer)) {
      const correctSequence = question.sequence_items;
      const submittedSequence = answer;
      
      // Check if all items are in correct order
      let correctCount = 0;
      for (let i = 0; i < Math.min(correctSequence.length, submittedSequence.length); i++) {
        if (correctSequence[i] === submittedSequence[i]) {
          correctCount++;
        }
      }
      
      // Full points if all correct, 1 point if only 1 wrong, 0 points otherwise
      if (correctCount === correctSequence.length) {
        isCorrect = true;
        pointsAwarded = question.points;
      } else if (correctCount === correctSequence.length - 1) {
        isCorrect = true;
        pointsAwarded = 1;
      } else {
        isCorrect = false;
        pointsAwarded = 0;
      }
    }
    
    // Open text questions are not auto-scored (isCorrect remains null)

    // Create answer
    const newAnswer = this.answerRepository.create({
      question_id: questionId,
      team_id: teamId,
      answer_text: answerText,
      is_correct: isCorrect,
      points_awarded: pointsAwarded
    });
    await this.answerRepository.save(newAnswer);

    // Create sequence answers if needed
    if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
      for (let i = 0; i < answer.length; i++) {
        const sequenceAnswer = this.sequenceAnswerRepository.create({
          answer_id: newAnswer.id,
          item_text: answer[i],
          position: i
        });
        await this.sequenceAnswerRepository.save(sequenceAnswer);
      }
    }

    // Update team points if auto-scored
    if (isCorrect !== null) {
      await this.teamService.updateTeamPoints(teamId, team.total_points + pointsAwarded);
      // Refresh team data
      Object.assign(team, { total_points: team.total_points + pointsAwarded });
    }

    return { answer: newAnswer, team, isCorrect, pointsAwarded };
  }

  /**
   * Get answers for a question
   */
  async getAnswersForQuestion(questionId: string): Promise<Answer[]> {
    return await this.answerRepository.find({
      where: { question_id: questionId },
      relations: ['team']
    });
  }

  /**
   * Get answers for a team
   */
  async getAnswersForTeam(teamId: string): Promise<Answer[]> {
    return await this.answerRepository.find({
      where: { team_id: teamId },
      relations: ['question']
    });
  }

  /**
   * Get answer by ID
   */
  async getAnswerById(answerId: string): Promise<Answer | null> {
    return await this.answerRepository.findOne({ 
      where: { id: answerId },
      relations: ['team']
    });
  }

  /**
   * Score an answer manually
   */
  async scoreAnswer(answerId: string, points: number, isCorrect: boolean): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['team']
    });

    if (!answer) {
      throw new Error('Answer not found');
    }

    const pointsDifference = points - answer.points_awarded;

    // Update answer
    await this.answerRepository.update(answerId, {
      points_awarded: points,
      is_correct: isCorrect
    });

    // Update team points
    await this.teamService.updateTeamPoints(answer.team_id, answer.team.total_points + pointsDifference);
  }

  /**
   * Delete answer
   */
  async deleteAnswer(answerId: string): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['team']
    });
    if (!answer) {
      throw new Error('Answer not found');
    }
    if (answer.points_awarded > 0) {
      await this.teamService.updateTeamPoints(answer.team.id, answer.team.total_points - answer.points_awarded);
    }
    await this.answerRepository.remove(answer);
  }
}
