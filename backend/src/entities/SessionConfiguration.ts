import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { QuizSession } from './QuizSession';

export interface RoundConfiguration {
  roundNumber: number;
  themeId: string;
  themeName: string;
  questionTypes: {
    type: string;
    enabled: boolean;
    questionCount: number;
    maxAvailable: number;
  }[];
  totalQuestions: number;
}

@Entity('session_configurations')
@Index(['quiz_session_id'])
export class SessionConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  quiz_session_id!: string;

  @Column({ type: 'int', default: 1 })
  total_rounds!: number;

  @Column({ type: 'json' })
  round_configurations!: RoundConfiguration[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relationships
  @ManyToOne(() => QuizSession, session => session.configuration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_session_id' })
  quizSession!: QuizSession;
}
