import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Answer } from './answer.entity'

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn()
  public readonly id: number

  @Column()
  public readonly originalQuestionId: string

  @Column()
  public readonly originalQuestionText: string

  @Column({ nullable: true })
  public completionMessage?: string

  @CreateDateColumn()
  public readonly createdAt: Date

  @OneToMany(() => Answer, (answer) => answer.conversation)
  public readonly answers: Answer[]
}
