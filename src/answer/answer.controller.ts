import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  Get
} from '@nestjs/common'
import { AnswerService } from './application/answer.service'
import { CreateAnswerDto } from './dto/answer/create-answer.dto'
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RateLimit } from 'nestjs-rate-limiter'
import { MessageResponseDto } from './dto/message/message-response.dto'
import { ApiResponseUtil, IApiResponse } from 'src/common/utils/api-response.util'
import { Conversation } from './entities/conversation.entity'

@ApiTags('질문에서 대한 답변 생성 및 대화 이어가기..')
@Controller('conversations')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @ApiOperation({ summary: '대화 메시지 처리 (시작 및 이어가기)' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '대화 ID' })
  @ApiBody({ type: CreateAnswerDto })
  @RateLimit({ keyPrefix: 'handle-messages', points: 10, duration: 60 })
  @Post(':conversationId/messages')
  public async handleMessages(
    @Param('conversationId') conversationId: number,
    @Body() createAnswerDto: CreateAnswerDto
  ): Promise<IApiResponse<MessageResponseDto>> {
    const result = await this.answerService.handleConversation(
      conversationId,
      createAnswerDto.userResponse
    )
    return ApiResponseUtil.success(result, '대화 이어가기 성공', HttpStatus.OK)
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: '대화 내용들 조회', description: '방ID에 해당하는 메시지 목록 조회' })
  @ApiParam({ name: 'conversationId', type: Number, required: true, description: '대화 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '대화 내용들 조회 성공',
    type: MessageResponseDto
  })
  public async getMessages(
    @Param('conversationId') conversationId: number
  ): Promise<IApiResponse<Conversation>> {  
    const messages = await this.answerService.getMessagesByConversationId(conversationId)

    return ApiResponseUtil.success(messages, '대화 내용들 조회 성공', HttpStatus.OK)
  }
}
