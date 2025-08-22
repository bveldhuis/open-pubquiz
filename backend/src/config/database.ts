import { DataSource } from 'typeorm';
import { QuizSession } from '../entities/QuizSession';
import { Question } from '../entities/Question';
import { Team } from '../entities/Team';
import { Answer } from '../entities/Answer';
import { SequenceAnswer } from '../entities/SequenceAnswer';
import { SessionEvent } from '../entities/SessionEvent';
import { Theme } from '../entities/Theme';
import { QuestionSet } from '../entities/QuestionSet';
import { SessionConfiguration } from '../entities/SessionConfiguration';
import { ApiKey } from '../entities/ApiKey';



export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'pubquiz_user',
  password: process.env.DB_PASSWORD || 'pubquiz_password',
  database: process.env.DB_DATABASE || 'pubquiz',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    QuizSession,
    Question,
    Team,
    Answer,
    SequenceAnswer,
    SessionEvent,
    Theme,
    QuestionSet,
    SessionConfiguration,
    ApiKey
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  charset: 'utf8mb4',
  timezone: 'Z'
});
