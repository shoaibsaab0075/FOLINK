import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm'
import { QuestionSet } from './question-set.entity'
import { IsDate, IsString } from 'class-validator'
import { Conversation } from 'src/answer/entities/conversation.entity'

@Entity('question_stacks')
export class QuestionStack {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  public readonly id!: number

  @Column({ type: 'varchar', name: 'stack_name', nullable: false })
  public stackName: string

  @Column({ type: 'varchar', name: 'question', nullable: false })
  @IsString()
  public question: string

  @Column({ type: 'varchar', name: 'purpose', nullable: false })
  @IsString()
  public purpose: string

  @CreateDateColumn({ name: 'create_At', type: 'timestamp', nullable: false })
  @IsDate()
  public readonly createdAt!: Date

  @ManyToOne(() => QuestionSet, (set) => set.questionStacks)
  @Index()
  public questionSet: QuestionSet

  @Column({ type: 'integer', name: 'conversationId', nullable: true })
  public conversationId!: number

  private constructor(
    stackName: string,
    question: string,
    purpose: string,
    questionSet: QuestionSet
  ) {
    this.stackName = stackName
    this.question = question
    this.purpose = purpose
    this.questionSet = questionSet
  }

  static createQuestionStack(
    stackName: string,
    question: string,
    purpose: string,
    questionSet: QuestionSet
  ): QuestionStack {
    return new QuestionStack(stackName, question, purpose, questionSet)
  }
}
