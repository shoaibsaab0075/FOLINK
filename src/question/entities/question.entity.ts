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

@Entity()
export class Question extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id'
  })
  public readonly id: number

  // 프로젝트 명
  @Column({
    type: 'varchar',
    name: 'projectName',
    nullable: false
  })
  @IsString()
  public projectName: string

  // 해당 프로젝트에 관한 질문
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

  @ManyToOne(() => QuestionSet, (set) => set.questions)
  @Index()
  public questionSet: QuestionSet

  @CreateDateColumn({
    name: 'create_At',
    type: 'timestamp',
    nullable: false
  })
  @IsDate()
  public readonly createdAt: Date

  // 생성자 추가 (직접 인스턴스 생성 방지 및 초기화 관리)
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

  // 도메인 팩토리 메서드
  static createQuestion(
    projectName: string,
    question: string,
    purpose: string,
    questionSet: QuestionSet
  ): Question {
    return new Question(projectName, question, purpose, questionSet)
  }
}
