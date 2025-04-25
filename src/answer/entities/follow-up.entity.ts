import { IsDate, IsString } from 'class-validator'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Answer } from './answer.entity'

@Entity()
export class FollowUp extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  public readonly id: number

  @Column({ type: 'varchar', name: 'text', nullable: false })
  @IsString()
  public text: string

  @Column({ type: 'varchar', name: 'purpose', nullable: false })
  @IsString()
  public purpose: string

  @Column({ type: 'text', name: 'interviewer_thoughts', nullable: false })
  @IsString()
  public interviewerThoughts: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  @IsDate()
  public readonly createdAt: Date

  @ManyToOne(() => Answer, (answer) => answer.id, { nullable: false })
  @Index()
  public answer: Answer;

  private constructor(text: string, purpose: string, interviewerThoughts: string, answer: Answer) {
    super()
    this.text = text
    this.purpose = purpose
    this.interviewerThoughts = interviewerThoughts
    this.answer = answer
  }

  static createFollowUp(
    text: string,
    purpose: string,
    interviewerThoughts: string,
    answer: Answer
  ): FollowUp {
    return new FollowUp(text, purpose, interviewerThoughts, answer)
  }
}
