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
import { QuestionStack } from './question-stack.entity'

// 여러개의 질문을 한 세트로 묶어서 관리 하려고 생성
@Entity()
export class QuestionSet extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id'
  })
  public readonly id: number

  // 프로젝트 명
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

  @OneToMany(() => QuestionStack, (stack) => stack.questionSet, { cascade: true })
  public questionStacks: QuestionStack[]

  // 외부에서 직접 인스턴스를 생성하는 것을 방지 (new방지)
  private constructor(projectName: string) {
    super() // super() 호출 추가
    this.originalText = projectName
  }

  // 정적 팩토리 메소드로 새로운 QuestionSet 인스턴스를 생성하고 초기 질문을 []으로 생성
  static createQuestionSet(originalText: string, questions: Question[] = []): QuestionSet {
    const set = new QuestionSet(originalText)
    questions.forEach((question) => set.addQuestion(question))
    return set
  }

  // Question 엔티티를 questions 배열에 추가하고, 양방향 관계(questionSet)를 설정. 배열이 없으면 초기화.
  public addQuestion(question: Question): void {
    question.questionSet = this // 양방향 설정 - 현재 QuestionSet을 QuestionSet에 설정
    if (!this.questions) {
      this.questions = []
    }
    this.questions.push(question)
  }

  public addQuestionStack(questionStack: QuestionStack): void {
    questionStack.questionSet = this
    if (!this.questionStacks) {
      this.questionStacks = []
    }
    this.questionStacks.push(questionStack)
  }
}
