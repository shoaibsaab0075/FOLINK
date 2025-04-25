import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { ResponseFollowUpQuestionDto } from './response-follow-up-question.dto'

export class ResponseFollowUpDto {
  @ApiProperty()
  @Expose()
  public readonly id: number

  @ApiProperty()
  @Expose()
  @Type(() => ResponseFollowUpQuestionDto)
  public readonly question: ResponseFollowUpQuestionDto

  @ApiProperty()
  @Expose()
  public readonly interviewer_thoughts: string

  @ApiProperty()
  @Expose()
  public readonly created_at: Date
}
