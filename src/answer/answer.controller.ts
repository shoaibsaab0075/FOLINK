import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'
import { AnswerService } from './application/answer.service'
import { CreateAnswerDto } from './dto/answer/create-answer.dto'
import { ApiResponseUtil, IApiResponse } from 'src/util/api-response.util'
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'
import { ResponseConversationHistoryDto } from './dto/conversations/response-conversation-history.dto'
import { RateLimit } from 'nestjs-rate-limiter'
import { ResponseAllConversationsDto } from './dto/conversations/response-all-conversations.dto'

@Controller('answer')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @ApiOperation({ summary: '간소화된 답변 처리 및 후속 질문 대화' })
  @ApiParam({ name: 'questionType', enum: ['techStack', 'project'] })
  @ApiBody({ type: CreateAnswerDto })
  @ApiResponse({ status: 201, type: ResponseConversationHistoryDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 429 })
  @ApiResponse({ status: 500 })
  @RateLimit({ keyPrefix: 'process-conversation-simple', points: 10, duration: 60 })
  @Post('conversation/:questionType/:questionId')
  public async processConversationSimple(
    @Param('questionType') questionType: 'techStack' | 'project',
    @Param('questionId') questionId: string,
    @Body() createAnswerDto: CreateAnswerDto
  ): Promise<IApiResponse<ResponseConversationHistoryDto>> {
    if (!['techStack', 'project'].includes(questionType)) {
      return ApiResponseUtil.error(
        `유효하지 않은 questionType입니다. 'techStack' 또는 'project'이어야 합니다. (입력값: ${questionType})`,
        HttpStatus.BAD_REQUEST
      )
    }

    const result = await this.answerService.fetchQuestion(questionType, questionId)
    if (!result) {
      const [baseId] = questionId.split(':')
      const parsedId = parseInt(baseId)
      return ApiResponseUtil.error(
        `ID ${parsedId}에 해당하는 ${questionType === 'techStack' ? '기술' : '프로젝트'} 질문을 찾을 수 없습니다.`,
        HttpStatus.NOT_FOUND
      )
    }

    const { questionText, originalQuestionId, purpose } = result
    const conversation = await this.answerService.createConversation(
      originalQuestionId,
      questionText
    )
    const conversationStep = await this.answerService.processAnswerAndFollowUp(
      conversation,
      createAnswerDto.userResponse,
      originalQuestionId,
      questionText,
      purpose
    )

    return ApiResponseUtil.success(
      this.answerService.buildConversationHistory(conversation, [conversationStep], null),
      '질문에 기반한 답변 생성 완료',
      HttpStatus.CREATED
    )
  }

  @ApiOperation({ summary: '대화 이어가기' })
  @ApiParam({ name: 'conversationId', type: Number })
  @ApiBody({ schema: { properties: { userResponse: { type: 'string' } } } })
  @ApiResponse({ status: 200, type: ResponseConversationHistoryDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 429 })
  @ApiResponse({ status: 500 })
  @RateLimit({ keyPrefix: 'continue-conversation', points: 10, duration: 60 })
  @Post('continue/:conversationId')
  public async continueConversation(
    @Param('conversationId') conversationId: number,
    @Body('userResponse') userResponse: string
  ): Promise<IApiResponse<ResponseConversationHistoryDto>> {
    const conversation = await this.answerService.fetchConversation(conversationId)
    if (!conversation) {
      return ApiResponseUtil.error(
        `ID ${conversationId}에 해당하는 대화 세션을 찾을 수 없습니다.`,
        HttpStatus.NOT_FOUND
      )
    }

    if (conversation.completionMessage === this.answerService.getCompletionMessage()) {
      return ApiResponseUtil.error(
        '이 대화는 이미 완료되었습니다. 새로운 질문을 시작해 주세요.',
        HttpStatus.BAD_REQUEST
      )
    }

    const result = await this.answerService.continueConversation(conversationId, userResponse)
    return ApiResponseUtil.success(result, '질의응답 이어가기 성공', HttpStatus.OK)
  }

  @ApiOperation({ summary: '모든 질의응답 기록 조회' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: ResponseAllConversationsDto })
  @ApiResponse({ status: 500 })
  @Get()
  public async getAllConversations(): Promise<IApiResponse<ResponseAllConversationsDto>> {
    const conversations = await this.answerService.getAllConversations()
    return ApiResponseUtil.success(conversations, '질의응답 기록 조회 성공', HttpStatus.OK)
  }
}
