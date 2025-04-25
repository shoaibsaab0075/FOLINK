import { Controller, Post, Body, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateQuestionSetDto } from './dto/create-question-set.dto'
import { RateLimit } from 'nestjs-rate-limiter'
import { GeminiApiError, ValidationError } from 'src/common/error'
import { ApiResponseUtil, IApiResponse } from 'src/util/api-response.util'

@ApiTags('텍스트를 통해 질문 추출')
@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @ApiOperation({ summary: '질문 추출', description: '텍스트를 주입해 질문을 추출하는 AP입니다' })
  @ApiBody({ type: CreateQuestionDto })
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: '질문들 생성 성공', type: CreateQuestionSetDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 429, description: '요청 제한 초과' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @RateLimit({ keyPrefix: 'generate-questions', points: 10, duration: 60 })         // 1분에 10번 요청 제한
  @Post('generate-by-text')
  public async generateQuestionsByText(
    @Body() createQuestionDto: CreateQuestionDto
  ): Promise<IApiResponse<CreateQuestionSetDto>> {
    try {
      const questionSet = await this.questionService.createQuestion(createQuestionDto)

      return ApiResponseUtil.success<CreateQuestionSetDto>(
        questionSet,
        'text값에 대한 질문 생성',
        HttpStatus.CREATED
      )
    } catch (error) {
      if (error instanceof ValidationError) {
        return ApiResponseUtil.error('입력 데이터 검증 실패', HttpStatus.BAD_REQUEST, {
          details: error.message
        })
      }
      if (error instanceof GeminiApiError) {
        return ApiResponseUtil.error('Gemini API 호출 실패', HttpStatus.INTERNAL_SERVER_ERROR, {
          details: error.message
        })
      }

      return ApiResponseUtil.error('서버 오류 발생', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
