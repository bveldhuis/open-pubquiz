import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { QuizSession } from './QuizSession';
import { Answer } from './Answer';

@Entity('teams')
@Index(['quiz_session_id'])
@Index(['total_points'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  quiz_session_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int', default: 0 })
  total_points!: number;

  @CreateDateColumn()
  joined_at!: Date;

  @UpdateDateColumn()
  last_activity!: Date;

  // Relationships
  @ManyToOne(() => QuizSession, session => session.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_session_id' })
  quizSession!: QuizSession;

  @OneToMany(() => Answer, answer => answer.team)
  answers!: Answer[];
}
