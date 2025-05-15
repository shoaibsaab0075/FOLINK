import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateQuestionSetDto } from './dto/create-question-set.dto'
import { RateLimit } from 'nestjs-rate-limiter'
import { ApiResponseUtil, IApiResponse } from 'src/common/util/api-response.util'

@ApiTags('텍스트를 통해 질문 추출')
@Controller('question-sets')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @ApiOperation({ summary: '질문 추출', description: '텍스트를 주입해 질문을 추출하는 API입니다' })
  @ApiBody({ type: CreateQuestionDto })
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ keyPrefix: 'generate-questions', points: 10, duration: 60 })
  @Post('generate-by-text')
  public async generateQuestionsByText(
    @Body() createQuestionDto: CreateQuestionDto
  ): Promise<IApiResponse<{ questionSet: CreateQuestionSetDto }>> {
    const questionSet = await this.questionService.createQuestion(createQuestionDto)
    return ApiResponseUtil.success({ questionSet }, 'text값에 대한 질문 생성', HttpStatus.CREATED)
  }

  @ApiOperation({ summary: '질문 세트 조회', description: '추출된 질문 리스트 목록 조회' })
  @HttpCode(HttpStatus.OK)
  @Get(':questionId')
  public async getQuestions(
    @Param('questionId') questionId: number
  ): Promise<IApiResponse<CreateQuestionSetDto>> {
    const questionSet = await this.questionService.getQuestionsById(questionId)
    return ApiResponseUtil.success(questionSet, '질문 세트 조회 성공', HttpStatus.OK)
  }
}
