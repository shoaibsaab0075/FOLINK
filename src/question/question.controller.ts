import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateQuestionSetDto } from './dto/create-question-set.dto'
import { RateLimit } from 'nestjs-rate-limiter'
import { ApiResponseUtil, IApiResponse } from 'src/common/utils/api-response.util'
import { FileInterceptor } from '@nestjs/platform-express'

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

  @ApiOperation({
    summary: 'PDF로 질문 추출',
    description: 'PDF 파일을 업로드하여 텍스트를 추출하고 질문을 생성하는 API입니다'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ keyPrefix: 'generate-questions-pdf', points: 10, duration: 60 })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new Error('PDF 파일만 허용됩니다'), false)
        }
        cb(null, true)
      },
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB 제한
    })
  )
  @Post('generate-by-pdf')
  public async generateQuestionsByPdf(
    @UploadedFile() file: Express.Multer.File
  ): Promise<IApiResponse<{ questionSet: CreateQuestionSetDto }>> {
    const text = await this.questionService.extractTextFromPdf(file.buffer)
    const createQuestionDto = new CreateQuestionDto()
    createQuestionDto.userResponse = text
    const questionSet = await this.questionService.createQuestion(createQuestionDto)
    return ApiResponseUtil.success({ questionSet }, 'PDF 기반 질문 생성 성공', HttpStatus.CREATED)
  }

  @ApiOperation({ summary: '질문 세트 조회', description: '추출된 질문 리스트 목록 조회' })
  @HttpCode(HttpStatus.OK)
  @Get(':questionSetId')
  public async getQuestions(
    @Param('questionSetId') questionId: number
  ): Promise<IApiResponse<CreateQuestionSetDto | null>> {
    const questionSet = await this.questionService.getQuestionsById(questionId)

    return ApiResponseUtil.success(questionSet, '질문 세트 조회 성공', HttpStatus.OK)
  }
}
