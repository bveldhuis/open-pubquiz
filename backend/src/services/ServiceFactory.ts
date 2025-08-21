import { SessionService } from './SessionService';
import { TeamService } from './TeamService';
import { QuestionService } from './QuestionService';
import { AnswerService } from './AnswerService';
import { CleanupService } from './CleanupService';
import { ITeamService } from './interfaces/ITeamService';
import { ISessionService } from './interfaces/ISessionService';
import { IQuestionService } from './interfaces/IQuestionService';
import { IAnswerService } from './interfaces/IAnswerService';
import { CleanupConfig } from './CleanupService';

export class ServiceFactory {
  private static instance: ServiceFactory;

  private constructor() {}

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  public createSessionService(teamService: ITeamService): ISessionService {
    return new SessionService(teamService);
  }

  public createTeamService(): ITeamService {
    return new TeamService();
  }

  public createQuestionService(sessionService: ISessionService): IQuestionService {
    return new QuestionService(sessionService);
  }

  public createAnswerService(questionService: IQuestionService, teamService: ITeamService): IAnswerService {
    return new AnswerService(questionService, teamService);
  }

  public createCleanupService(sessionService: ISessionService, config?: Partial<CleanupConfig>): CleanupService {
    return new CleanupService(sessionService, config);
  }
}
