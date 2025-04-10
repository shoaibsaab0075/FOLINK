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

  @Column({
    type: 'varchar',
    name: 'title',
    nullable: false
  })
  @IsString()
  public title: string

  @Column({
    type: 'varchar',
    name: 'question',
    nullable: false
  })
  @IsString()
  public question: string

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
  private constructor(title: string, question: string, questionSet: QuestionSet) {
    super()
    this.title = title
    this.question = question
    this.questionSet = questionSet
  }

  // 도메인 팩토리 메서드
  static createQuestion(title: string, question: string, questionSet: QuestionSet): Question {
    return new Question(title, question, questionSet)
  }
}
