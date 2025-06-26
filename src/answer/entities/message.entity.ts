import { IsString } from 'class-validator'
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
import { MessageType } from '../enum/message.type'

@Entity()
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  public readonly id!: number

  @Column({ type: 'text', name: 'content', nullable: false })
  @IsString()
  public content: string

  @Column({ type: 'varchar', name: 'type', nullable: false })
  @IsString()
  public type: MessageType

  @Column({ type: 'text', name: 'evaluator_feedback', nullable: true })
  @IsString()
  public evaluatorFeedback?: string // AI 메시지에만 사용**

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    precision: 6,
    nullable: false
  })
  public createdAt!: Date

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { nullable: false })
  @Index()
  public conversation!: Conversation

  private constructor(content: string, type: MessageType, evaluatorFeedback?: string) {
    super()
    this.content = content
    this.type = type
    this.evaluatorFeedback = evaluatorFeedback
  }

  static createMessage(content: string, type: MessageType, evaluatorFeedback?: string): Message {
    return new Message(content, type, evaluatorFeedback)
  }
}
