import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Theme } from './Theme';
import { QuestionType } from './Question';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

@Entity('question_sets')
@Index(['theme_id', 'type'])
@Index(['theme_id', 'is_active'])
export class QuestionSet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  theme_id!: string;

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
  numerical_tolerance!: number | null; // tolerance for numerical questions

  @Column({
    type: 'enum',
    enum: Difficulty,
    default: Difficulty.MEDIUM
  })
  difficulty!: Difficulty;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relationships
  @ManyToOne(() => Theme, theme => theme.questionSets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'theme_id' })
  theme!: Theme;
}
