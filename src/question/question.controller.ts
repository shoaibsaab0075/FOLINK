import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common'
import { QuestionService } from './question.service'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post('create-question')
  public async create(@Body(ValidationPipe) createQuestionDto: CreateQuestionDto) {
    const question = await this.questionService.create(createQuestionDto)

    return {
      data: question,
      message: '질문에 대한 답변입니다'
    }
  }

  @Get()
  findAll() {
    return this.questionService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionService.update(+id, updateQuestionDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionService.remove(+id)
  }
}
