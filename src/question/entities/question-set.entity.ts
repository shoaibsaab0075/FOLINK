import { IsDate, IsString } from 'class-validator'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Question } from './question.entity'

// 여러개의 질문을 한 세트로 묶어서 관리 하려고 생성
@Entity()
export class QuestionSet extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id'
  })
  public readonly id: number

  @Column({
    name: 'original_text',
    type: 'varchar',
    nullable: false
  })
  @IsString()
  public originalText: string

  @CreateDateColumn({
    name: 'create_At',
    type: 'timestamp',
    nullable: false
  })
  @IsDate()
  public readonly createdAt: Date

  @OneToMany(() => Question, (question) => question.questionSet, { cascade: true })
  public questions: Question[]

  private constructor(originalText: string) {
    super() // super() 호출 추가
    this.originalText = originalText
  }

  static createQuestionSet(originalText: string, questions: Question[] = []): QuestionSet {
    const set = new QuestionSet(originalText)
    questions.forEach((question) => set.addQuestion(question))
    return set
  }

  addQuestion(question: Question): void {
    question.questionSet = this
    if (!this.questions) {
      this.questions = []
    }
    this.questions.push(question)
  }
}
