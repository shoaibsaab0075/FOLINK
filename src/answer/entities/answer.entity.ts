import { IsDate, IsString } from 'class-validator'
import { QuestionStack } from 'src/question/entities/question-stack.entity'
import { Question } from 'src/question/entities/question.entity'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Conversation } from './conversation.entity'

@Entity()
export class Answer extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  public readonly id: number

  @Column({ type: 'varchar', name: 'original_question_id', nullable: false })
  @IsString()
  public originalQuestionId: string

  @Column({ type: 'varchar', name: 'original_question_text', nullable: false })
  @IsString()
  public originalQuestionText: string

  @Column({ type: 'text', name: 'user_response', nullable: false })
  @IsString()
  public userResponse: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  @IsDate()
  public readonly createdAt: Date

  @ManyToOne(() => Conversation, (conversation) => conversation.answers, { nullable: false })
  @Index()
  public conversation: Conversation;

  private constructor(
    originalQuestionId: string,
    originalQuestionText: string,
    userResponse: string
  ) {
    super()
    this.originalQuestionId = originalQuestionId
    this.originalQuestionText = originalQuestionText
    this.userResponse = userResponse
  }

  static createAnswer(
    originalQuestionId: string,
    originalQuestionText: string,
    userResponse: string
  ): Answer {
    return new Answer(originalQuestionId, originalQuestionText, userResponse)
  }
}
