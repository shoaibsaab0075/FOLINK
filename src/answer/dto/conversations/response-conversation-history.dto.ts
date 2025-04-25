import { Expose, Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { ResponseConversationStepDto } from './response-conversation-step.dto'

export class ResponseConversationHistoryDto {
  @ApiProperty()
  @Expose()
  public readonly original_question_id: string

  @ApiProperty()
  @Expose()
  public readonly original_question_text: string

  @ApiProperty()
  @Expose()
  @Type(() => ResponseConversationStepDto)
  public readonly conversation: ResponseConversationStepDto[]

  @ApiProperty({ required: false })
  @Expose()
  public readonly completionMessage?: string

  @ApiProperty()
  @Expose()
  public readonly conversationId: number
}
