import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Conversation } from 'src/answer/entities/conversation.entity'

@Entity()
export class Feedback extends BaseEntity {
  @PrimaryGeneratedColumn()
  public readonly id!: number

  @ManyToOne(() => Conversation, (conversation) => conversation.id, { nullable: false })
  public conversation!: Conversation

  @Column({ type: 'text', nullable: false })
  public content!: string                       // 전반적 피드백 내용

  @Column({ type: 'text', nullable: false })
  public strengths!: string                     // 강점

  @Column({ type: 'text', nullable: false })
  public overallImpression!: string             // 전체적인 인상

  @Column({ type: 'text', nullable: false })
  public improvementPoints!: string             // 개선점

  @Column({ type: 'text', nullable: false })
  public additionalAdvice!: string              // 추가 조언

  @CreateDateColumn()
  public readonly createdAt!: Date

  private constructor(conversation: Conversation, content: string) {
    super()
    this.conversation = conversation
    this.content = content
  }

  public static createFeedback(
    conversation: Conversation,
    content: string,
    strengths: string,
    overallImpression: string,
    improvementPoints: string,
    additionalAdvice: string
  ): Feedback {
    const feedback = new Feedback(conversation, content)
    feedback.strengths = strengths
    feedback.overallImpression = overallImpression
    feedback.improvementPoints = improvementPoints
    feedback.additionalAdvice = additionalAdvice
    return feedback
  }
}
