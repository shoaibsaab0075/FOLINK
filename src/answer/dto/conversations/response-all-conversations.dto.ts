import { Expose, Type } from 'class-transformer'
import { ResponseConversationHistoryDto } from './response-conversation-history.dto'
import { ApiProperty } from '@nestjs/swagger'

export class ResponseAllConversationsDto {
  @ApiProperty()
  @Expose()
  @Type(() => ResponseConversationHistoryDto)
  public readonly conversations: ResponseConversationHistoryDto[]
}
