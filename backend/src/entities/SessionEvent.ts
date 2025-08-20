import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { QuizSession } from './QuizSession';

export enum EventType {
  SESSION_CREATED = 'session_created',
  QUESTION_STARTED = 'question_started',
  QUESTION_ENDED = 'question_ended',
  ROUND_STARTED = 'round_started',
  ROUND_ENDED = 'round_ended',
  SESSION_ENDED = 'session_ended',
  START_QUESTION = 'start_question',
  END_QUESTION = 'end_question',
  SHOW_LEADERBOARD = 'show_leaderboard',
  SHOW_REVIEW = 'show_review',
  NEXT_ROUND = 'next_round'
}

@Entity('session_events')
@Index(['quiz_session_id'])
@Index(['event_type'])
@Index(['created_at'])
export class SessionEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  quiz_session_id!: string;

  @Column({
    type: 'enum',
    enum: EventType
  })
  event_type!: EventType;

  @Column({ type: 'json', nullable: true })
  event_data!: any;

  @CreateDateColumn()
  created_at!: Date;

  // Relationships
  @ManyToOne(() => QuizSession, session => session.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_session_id' })
  quizSession!: QuizSession;
}
