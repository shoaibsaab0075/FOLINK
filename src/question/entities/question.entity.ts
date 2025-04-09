import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'
import { IsDate, IsString } from 'class-validator'

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
  public readonly title: string

  @Column({
    type: 'varchar',
    name: 'question',
    nullable: false
  })
  @IsString()
  public readonly question: string

  @CreateDateColumn({
    name: 'create_At',
    type: 'timestamp',
    nullable: false
  })
  @IsDate()
  public readonly createdAt: Date
}
