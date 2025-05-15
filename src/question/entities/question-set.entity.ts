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

@Entity()
export class QuestionSet extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  public readonly id: number

  @Column({ name: 'original_text', type: 'varchar', nullable: false })
  @IsString()
  public originalText: string

  @CreateDateColumn({ name: 'create_At', type: 'timestamp', nullable: false })
  @IsDate()
  public readonly createdAt: Date

  @OneToMany(() => Question, (question) => question.questionSet)
  public questions: Question[]

  @OneToMany(() => QuestionStack, (stack) => stack.questionSet)
  public questionStacks: QuestionStack[]

  private constructor(originalText: string) {
    super()
    this.originalText = originalText
  }

  static createQuestionSet(originalText: string): QuestionSet {
    const set = new QuestionSet(originalText)
    set.questions = []
    set.questionStacks = []
    return set
  }

  public addQuestion(question: Question): void {
    question.questionSet = this
    this.questions.push(question)
  }

  public addQuestionStack(questionStack: QuestionStack): void {
    questionStack.questionSet = this
    this.questionStacks.push(questionStack)
  }
}
