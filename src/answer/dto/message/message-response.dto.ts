import { Expose } from 'class-transformer'
import { IsInt, IsEnum, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ResponseOriginalQuestionDto {
  @Expose()
  @IsInt()
  public readonly id: number

  @Expose()
  @IsEnum(['techStack', 'project'])
  public readonly type: 'techStack' | 'project'

  @Expose()
  @IsString()
  public readonly text: string
}

export class ResponseMessageDto {
  @Expose()
  @IsInt()
  public readonly id: number

  @Expose()
  @IsEnum(['user', 'ai'])
  public readonly type: 'user' | 'ai'

  @Expose()
  @IsString()
  public readonly content: string

  @Expose()
  @IsString()
  public readonly created_at: string

  @Expose()
  @IsString()
  public readonly evaluator_feedback?: string
}

export class MessageResponseDto {
  @Expose()
  @IsInt()
  public readonly id: number

  @Expose()
  @ValidateNested()
  @Type(() => ResponseOriginalQuestionDto)
  public readonly original_question: ResponseOriginalQuestionDto

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseMessageDto)
  public readonly messages: ResponseMessageDto[]

  @Expose()
  @IsEnum(['on_going', 'end'])
  public readonly status: 'on_going' | 'end'
}
