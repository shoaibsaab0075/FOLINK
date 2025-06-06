import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { IsDate, IsString } from 'class-validator'
import { QuestionSet } from './question-set.entity'
import { Conversation } from 'src/answer/entities/conversation.entity'

@Entity()
export class Question extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  public readonly id: number

  @Column({ type: 'varchar', name: 'projectName', nullable: false })
  @IsString()
  public projectName: string

  @Column({ type: 'varchar', name: 'question', nullable: false })
  @IsString()
  public question: string

  @Column({ type: 'varchar', name: 'purpose', nullable: false })
  @IsString()
  public purpose: string

  @ManyToOne(() => QuestionSet, (set) => set.questions)
  @Index()
  public questionSet: QuestionSet

  @Column({ type: 'integer', name: 'conversationId', nullable: false })
  public conversationId: number

  @CreateDateColumn({ name: 'create_At', type: 'timestamp', nullable: false })
  @IsDate()
  public readonly createdAt: Date

  private constructor(
    projectName: string,
    question: string,
    purpose: string,
    questionSet: QuestionSet
  ) {
    super()
    this.projectName = projectName
    this.question = question
    this.purpose = purpose
    this.questionSet = questionSet
  }

  static createQuestion(
    projectName: string,
    question: string,
    purpose: string,
    questionSet: QuestionSet
  ): Question {
    return new Question(projectName, question, purpose, questionSet)
  }
}
