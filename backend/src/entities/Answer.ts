import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index, Unique } from 'typeorm';
import { Question } from './Question';
import { Team } from './Team';
import { SequenceAnswer } from './SequenceAnswer';

@Entity('answers')
@Index(['question_id'])
@Index(['team_id'])
@Unique(['team_id', 'question_id'])
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  question_id!: string;

  @Column({ type: 'varchar', length: 36 })
  team_id!: string;

  @Column({ type: 'text' })
  answer_text!: string;

  @Column({ type: 'boolean', nullable: true })
  is_correct!: boolean | null;

  @Column({ type: 'int', default: 0 })
  points_awarded!: number;

  @CreateDateColumn()
  submitted_at!: Date;

  // Relationships
  @ManyToOne(() => Question, question => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @ManyToOne(() => Team, team => team.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @OneToMany(() => SequenceAnswer, sequenceAnswer => sequenceAnswer.answer)
  sequenceAnswers!: SequenceAnswer[];
}
