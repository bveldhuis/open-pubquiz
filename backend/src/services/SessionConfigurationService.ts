import { AppDataSource } from '../config/database';
import { SessionConfiguration, RoundConfiguration } from '../entities/SessionConfiguration';
import { Theme } from '../entities/Theme';
import { QuestionSet } from '../entities/QuestionSet';
import { Question } from '../entities/Question';
import { QuizSession } from '../entities/QuizSession';
import { v4 as uuidv4 } from 'uuid';

export interface RoundConfig {
  roundNumber: number;
  themeId: string;
  questionTypes: {
    type: string;
    enabled: boolean;
    questionCount: number;
  }[];
}

export interface SessionConfigRequest {
  sessionCode: string;
  totalRounds: number;
  roundConfigurations: RoundConfig[];
}

export class SessionConfigurationService {
  private sessionConfigRepository = AppDataSource.getRepository(SessionConfiguration);
  private themeRepository = AppDataSource.getRepository(Theme);
  private questionSetRepository = AppDataSource.getRepository(QuestionSet);
  private questionRepository = AppDataSource.getRepository(Question);
  private sessionRepository = AppDataSource.getRepository(QuizSession);

  async createSessionConfiguration(config: SessionConfigRequest): Promise<SessionConfiguration> {
    const session = await this.sessionRepository.findOne({
      where: { code: config.sessionCode }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Validate configurations
    await this.validateRoundConfigurations(config.roundConfigurations);

    // Build round configurations with theme names and max available counts
    const roundConfigurations: RoundConfiguration[] = [];
    
    for (const roundConfig of config.roundConfigurations) {
      const theme = await this.themeRepository.findOne({
        where: { id: roundConfig.themeId }
      });

      if (!theme) {
        throw new Error(`Theme not found: ${roundConfig.themeId}`);
      }

      const questionTypesWithCounts = await Promise.all(
        roundConfig.questionTypes.map(async (qt) => {
          const maxAvailable = await this.questionSetRepository.count({
            where: {
              theme_id: roundConfig.themeId,
              type: qt.type as any,
              is_active: true
            }
          });

          return {
            type: qt.type,
            enabled: qt.enabled,
            questionCount: qt.questionCount,
            maxAvailable
          };
        })
      );

      const totalQuestions = questionTypesWithCounts
        .filter(qt => qt.enabled)
        .reduce((sum, qt) => sum + qt.questionCount, 0);

      roundConfigurations.push({
        roundNumber: roundConfig.roundNumber,
        themeId: roundConfig.themeId,
        themeName: theme.name,
        questionTypes: questionTypesWithCounts,
        totalQuestions
      });
    }

    const sessionConfiguration = this.sessionConfigRepository.create({
      id: uuidv4(),
      quiz_session_id: session.id,
      total_rounds: config.totalRounds,
      round_configurations: roundConfigurations
    });

    return await this.sessionConfigRepository.save(sessionConfiguration);
  }

  async getSessionConfiguration(sessionCode: string): Promise<SessionConfiguration | null> {
    const session = await this.sessionRepository.findOne({
      where: { code: sessionCode }
    });

    if (!session) {
      return null;
    }

    return await this.sessionConfigRepository.findOne({
      where: { quiz_session_id: session.id }
    });
  }

  async generateQuestionsForRound(sessionCode: string, roundNumber: number): Promise<Question[]> {
    const session = await this.sessionRepository.findOne({
      where: { code: sessionCode }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const configuration = await this.sessionConfigRepository.findOne({
      where: { quiz_session_id: session.id }
    });

    if (!configuration) {
      throw new Error('Session configuration not found');
    }

    const roundConfig = configuration.round_configurations.find(
      rc => rc.roundNumber === roundNumber
    );

    if (!roundConfig) {
      throw new Error(`Round configuration not found for round ${roundNumber}`);
    }

    const questions: Question[] = [];
    let questionNumber = 1;

    for (const questionTypeConfig of roundConfig.questionTypes) {
      if (!questionTypeConfig.enabled || questionTypeConfig.questionCount === 0) {
        continue;
      }

      // Get available questions for this type
      const availableQuestions = await this.questionSetRepository.find({
        where: {
          theme_id: roundConfig.themeId,
          type: questionTypeConfig.type as any,
          is_active: true
        }
      });

      if (availableQuestions.length < questionTypeConfig.questionCount) {
        throw new Error(
          `Not enough questions available for type ${questionTypeConfig.type}. ` +
          `Available: ${availableQuestions.length}, Requested: ${questionTypeConfig.questionCount}`
        );
      }

      // Randomly select questions
      const selectedQuestions = this.shuffleArray(availableQuestions)
        .slice(0, questionTypeConfig.questionCount);

      // Convert QuestionSet to Question and save to database
      for (const questionSet of selectedQuestions) {
        const question = this.questionRepository.create({
          id: uuidv4(),
          quiz_session_id: session.id,
          round_number: roundNumber,
          question_number: questionNumber++,
          type: questionSet.type,
          question_text: questionSet.question_text,
          fun_fact: questionSet.fun_fact,
          time_limit: questionSet.time_limit,
          points: questionSet.points,
          options: questionSet.options,
          correct_answer: questionSet.correct_answer,
          sequence_items: questionSet.sequence_items,
          media_url: questionSet.media_url,
          numerical_answer: questionSet.numerical_answer,
          numerical_tolerance: questionSet.numerical_tolerance
        });

        const savedQuestion = await this.questionRepository.save(question);
        questions.push(savedQuestion);
      }
    }

    return questions.sort((a, b) => a.question_number - b.question_number);
  }

  async getAvailableThemes(): Promise<Theme[]> {
    return await this.themeRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' }
    });
  }

  async getThemeQuestionCounts(themeId: string): Promise<Record<string, number>> {
    const questionCounts = await this.questionSetRepository
      .createQueryBuilder('qs')
      .select('qs.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('qs.theme_id = :themeId', { themeId })
      .andWhere('qs.is_active = :isActive', { isActive: true })
      .groupBy('qs.type')
      .getRawMany();

    return questionCounts.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);
  }

  private async validateRoundConfigurations(roundConfigurations: RoundConfig[]): Promise<void> {
    for (const roundConfig of roundConfigurations) {
      // Validate theme exists
      const theme = await this.themeRepository.findOne({
        where: { id: roundConfig.themeId }
      });

      if (!theme) {
        throw new Error(`Theme not found: ${roundConfig.themeId}`);
      }

      // Validate at least one question type is enabled
      const enabledTypes = roundConfig.questionTypes.filter(qt => qt.enabled);
      if (enabledTypes.length === 0) {
        throw new Error(`Round ${roundConfig.roundNumber} must have at least one enabled question type`);
      }

      // Validate question counts
      for (const questionType of roundConfig.questionTypes) {
        if (questionType.enabled) {
          if (questionType.questionCount < 1) {
            throw new Error(`Question count must be at least 1 for type ${questionType.type}`);
          }

          // Check if enough questions are available
          const availableCount = await this.questionSetRepository.count({
            where: {
              theme_id: roundConfig.themeId,
              type: questionType.type as any,
              is_active: true
            }
          });

          if (availableCount < questionType.questionCount) {
            throw new Error(
              `Not enough questions available for type ${questionType.type}. ` +
              `Available: ${availableCount}, Requested: ${questionType.questionCount}`
            );
          }
        }
      }
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
