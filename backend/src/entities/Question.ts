import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { QuizSession } from './QuizSession';
import { Answer } from './Answer';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  OPEN_TEXT = 'open_text',
  SEQUENCE = 'sequence',
  TRUE_FALSE = 'true_false',
  NUMERICAL = 'numerical',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video'
}

@Entity('questions')
@Index(['quiz_session_id'])
@Index(['round_number', 'question_number'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  quiz_session_id!: string;

  @Column({ type: 'int' })
  round_number!: number;

  @Column({ type: 'int' })
  question_number!: number;

  @Column({
    type: 'enum',
    enum: QuestionType
  })
  type!: QuestionType;

  @Column({ type: 'text' })
  question_text!: string;

  @Column({ type: 'text', nullable: true })
  fun_fact!: string | null;

  @Column({ type: 'int', nullable: true })
  time_limit!: number | null; // in seconds

  @Column({ type: 'int', default: 1 })
  points!: number;

  @Column({ type: 'json', nullable: true })
  options!: string[] | null; // for multiple choice questions

  @Column({ type: 'text', nullable: true })
  correct_answer!: string | null;

  @Column({ type: 'json', nullable: true })
  sequence_items!: string[] | null; // for sequence questions

  @Column({ type: 'varchar', length: 500, nullable: true })
  media_url!: string | null; // for image, audio, video questions

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  numerical_answer!: number | null; // for numerical questions

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  numerical_tolerance!: number | null; // tolerance for numerical questions (e.g., ±0.5)

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relationships
  @ManyToOne(() => QuizSession, session => session.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_session_id' })
  quizSession!: QuizSession;

  @OneToMany(() => Answer, answer => answer.question)
  answers!: Answer[];
}
