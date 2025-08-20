import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Question } from './Question';
import { Team } from './Team';
import { SessionEvent } from './SessionEvent';

export enum QuizSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FINISHED = 'finished'
}

@Entity('quiz_sessions')
@Index(['status'])
export class QuizSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: QuizSessionStatus,
    default: QuizSessionStatus.WAITING
  })
  status!: QuizSessionStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  current_question_id!: string | null;

  @Column({ type: 'int', default: 1 })
  current_round!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relationships
  @OneToMany(() => Question, question => question.quizSession)
  questions!: Question[];

  @OneToMany(() => Team, team => team.quizSession)
  teams!: Team[];

  @OneToMany(() => SessionEvent, event => event.quizSession)
  events!: SessionEvent[];
}
