import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Answer } from './Answer';

@Entity('sequence_answers')
@Index(['answer_id'])
@Index(['position'])
export class SequenceAnswer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  answer_id!: string;

  @Column({ type: 'varchar', length: 500 })
  item_text!: string;

  @Column({ type: 'int' })
  position!: number;

  // Relationships
  @ManyToOne(() => Answer, answer => answer.sequenceAnswers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_id' })
  answer!: Answer;
}
