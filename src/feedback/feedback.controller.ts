import { Controller, Get, Param, Post, HttpStatus } from '@nestjs/common'
import { FeedbackService } from './application/feedback.service'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiResponseUtil, IApiResponse } from 'src/common/utils/api-response.util'
import { ResponseFeedbackDto } from './dto/response-feedback.dto'

@ApiTags('대화 피드백 관리')
@Controller('conversations')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get(':conversationId/feedback')
  @ApiOperation({
    summary: '대화에 대한 최종 피드백 조회',
    description: '종료된 대화에 대한 AI 피드백 제공'
  })
  @ApiParam({ name: 'conversationId', type: Number, required: true, description: '채팅방 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '피드백 조회 성공',
    type: ResponseFeedbackDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '피드백 또는 대화가 존재하지 않음' })
  public async getFeedback(
    @Param('conversationId') conversationId: number
  ): Promise<IApiResponse<ResponseFeedbackDto>> {
    const feedback = await this.feedbackService.getFeedbackByConversationId(conversationId)

    return ApiResponseUtil.success(feedback, '최종 피드백 조회 성공', HttpStatus.OK)
  }

  @Post(':conversationId/feedback')
  @ApiOperation({
    summary: '대화에 대한 피드백 생성',
    description: '종료된 대화에 대해 피드백을 생성하고 저장'
  })
  @ApiParam({ name: 'conversationId', type: Number, required: true, description: '채팅방 ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '피드백 생성 및 저장 성공',
    type: ResponseFeedbackDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '대화가 존재하지 않음' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '대화가 종료되지 않음' })
  public async generateFeedback(
    @Param('conversationId') conversationId: number
  ): Promise<IApiResponse<ResponseFeedbackDto>> {
    const feedback = await this.feedbackService.generateAndSaveFeedback(conversationId)

    return ApiResponseUtil.success(feedback, '피드백 생성 및 저장 성공', HttpStatus.OK)
  }
}
