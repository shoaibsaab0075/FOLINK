import { Controller, Post, Body, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateQuestionSetDto } from './dto/create-question-set.dto'

@ApiTags('텍스트를 통해 질문 추출')
@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @ApiOperation({ summary: '질문 추출', description: '텍스트를 주입해 질문을 추출하는 AP입니다' })
  @ApiBody({ type: CreateQuestionDto })
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: '질문들 생성 성공', type: CreateQuestionSetDto })
  @Post('generate-by-text')
  public async generateQuestionsByText(
    @Body(ValidationPipe) createQuestionDto: CreateQuestionDto
  ): Promise<{ data: CreateQuestionSetDto; message: string }> {
    const questionSet = await this.questionService.createQuestion(createQuestionDto)

    return {
      data: questionSet,
      message: 'text값에 대한 질문 생성'
    }
  }
}
