import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { ResponseAnswerDto } from '../answer/response-answer.dto'
import { ResponseFollowUpDto } from '../follow/response-follow-up.dto'

export class ResponseConversationStepDto {
  @ApiProperty()
  @Expose()
  @Type(() => ResponseAnswerDto)
  public readonly answer: ResponseAnswerDto

  @ApiProperty({ required: false })
  @Expose()
  @Type(() => ResponseFollowUpDto)
  public readonly follow_up?: ResponseFollowUpDto
}
