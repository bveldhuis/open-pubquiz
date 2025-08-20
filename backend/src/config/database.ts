import { DataSource } from 'typeorm';
import { QuizSession } from '../entities/QuizSession';
import { Question } from '../entities/Question';
import { Team } from '../entities/Team';
import { Answer } from '../entities/Answer';
import { SequenceAnswer } from '../entities/SequenceAnswer';
import { SessionEvent } from '../entities/SessionEvent';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '192.168.1.199',
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
    SessionEvent
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  charset: 'utf8mb4',
  timezone: 'Z'
});
