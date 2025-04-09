import { Injectable } from '@nestjs/common'
import { CreateQuestionDto } from './dto/create-question.dto'
import { UpdateQuestionDto } from './dto/update-question.dto'
import { Question } from './entities/question.entity'

@Injectable()
export class QuestionService {
  private question: [] = []

  public async create(dto: CreateQuestionDto) {
    const newQuestion = {
      id: this.question.length + 1,
      title: 'Nest.JS를 사용하는 이유가 있을까요??',
      question: 'Spring Boot프레임워크와의 차이점과 굳이 이 프레임워크를 고른 이점이 있을가요?'
    }
    this.question.push(newQuestion as never)

    return newQuestion
  }

  findAll() {
    return `This action returns all question`
  }

  findOne(id: number) {
    return `This action returns a #${id} question`
  }

  update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return `This action updates a #${id} question`
  }

  remove(id: number) {
    return `This action removes a #${id} question`
  }
}
