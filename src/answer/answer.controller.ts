import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpException,
  NotFoundException
} from '@nestjs/common'
import { AnswerService } from './application/answer.service'
import { CreateAnswerDto } from './dto/answer/create-answer.dto'
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RateLimit } from 'nestjs-rate-limiter'
import { QuestionService } from 'src/question/application/question.service'
import { MessageResponseDto } from './dto/message/message-response.dto'
import { ApiResponseUtil, IApiResponse } from 'src/common/util/api-response.util'
import { MessageRequestDto } from './dto/message/message-request.dto'

@ApiTags('질문에서 대한 답변 생성 및 대화 이어가기')
@Controller('conversations')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @ApiOperation({ summary: '대화 메시지 처리 (시작 및 이어가기)' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '대화 ID' })
  @ApiBody({ type: CreateAnswerDto })
  @RateLimit({ keyPrefix: 'handle-messages', points: 10, duration: 60 })
  @Post(':id/messages')
  public async handleMessages(
    @Param('id') conversationId: number,
    @Body() createAnswerDto: CreateAnswerDto
  ): Promise<IApiResponse<MessageResponseDto>> {
    const result = await this.answerService.handleConversation(conversationId, createAnswerDto.userResponse)
    return ApiResponseUtil.success(result, '대화 이어가기 성공', HttpStatus.OK)
  }
}
