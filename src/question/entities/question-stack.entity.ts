import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn } from 'typeorm'
import { QuestionSet } from './question-set.entity'
import { IsDate, IsString } from 'class-validator'

@Entity('question_stacks')
export class QuestionStack {
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id'
  })
  public readonly id: number

  // 기술 이름
  @Column({
    type: 'varchar',
    name: 'stack_name',
    nullable: false
  })
  public stackName: string

  // 기술에 대한 질문 (왜 썼는지 등)
  @Column({
    type: 'varchar',
    name: 'question',
    nullable: false
  })
  @IsString()
  public question: string

  // 질문에 대한 목적
  @Column({
    type: 'varchar',
    name: 'purpose',
    nullable: false
  })
  @IsString()
  public purpose: string

  @CreateDateColumn({
    name: 'create_At',
    type: 'timestamp',
    nullable: false
  })
  @IsDate()
  public readonly createdAt: Date

  @ManyToOne(() => QuestionSet, (set) => set.questionStacks)
  @Index()
  public questionSet: QuestionSet

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
