import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Message } from './message.entity'
import { Question } from 'src/question/entities/question.entity'
import { QuestionType } from 'src/question/enum/question.type'
import { StatusType } from '../enum/status.type'

// answer/entities/conversation.entity.ts
@Entity()
export class Conversation extends BaseEntity {
  @PrimaryGeneratedColumn()
  public readonly id: number

  @Column()
  public readonly originalQuestionId: string

  @Column()
  public readonly originalQuestionText: string

  @Column({ type: 'varchar', nullable: false })
  public readonly questionType: QuestionType

  @Column({ type: 'varchar', nullable: false, default: StatusType.ON_GOING })
  public status: StatusType

  @CreateDateColumn()
  public readonly createdAt: Date

  @OneToMany(() => Message, (message) => message.conversation)
  public messages: Message[] // 초기화 제거

  private constructor(
    originalQuestionId: string,
    originalQuestionText: string,
    questionType: QuestionType
  ) {
    super()
    this.originalQuestionId = originalQuestionId
    this.originalQuestionText = originalQuestionText
    this.questionType = questionType
    this.status = StatusType.ON_GOING
    // this.messages = []; // 초기화 코드 제거
  }

  static createConversation(
    originalQuestionId: string,
    originalQuestionText: string,
    questionType: QuestionType
  ): Conversation {
    return new Conversation(originalQuestionId, originalQuestionText, questionType)
  }

  public addMessage(message: Message): void {
    if (!this.messages) {
      this.messages = [] // 런타임에서 필요한 경우 초기화
    }
    message.conversation = this
    this.messages.push(message)
  }

  public endConversation(): void {
    this.status = StatusType.END
  }
}
