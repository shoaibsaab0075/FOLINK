import { Expose } from 'class-transformer'
import { IsInt, IsString, IsEnum, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { MessageType } from 'src/answer/enum/message.type'

export class OriginalQuestionDto {
  @Expose()
  @IsInt()
  public readonly id!: number

  @Expose()
  @IsEnum(['techStack', 'project'])
  public readonly type!: 'techStack' | 'project'

  @Expose()
  @IsString()
  public readonly text!: string
}

export class MessageDto {
  @Expose()
  @IsInt()
  public readonly id!: number

  @Expose()
  @IsEnum(['user', 'ai'])
  public readonly type!: MessageType

  @Expose()
  @IsString()
  public readonly content!: string

  @Expose()
  @IsString()
  public readonly created_at!: string

  @Expose()
  @IsString()
  public readonly evaluator_feedback?: string
}

export class MessageRequestDto {
  @Expose()
  @ValidateNested()
  @Type(() => OriginalQuestionDto)
  public readonly original_question!: OriginalQuestionDto

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  public readonly messages!: MessageDto[]
}
