import { Injectable } from '@nestjs/common'
import { CreateQuestionDto } from '../dto/create-question.dto'
import { Question } from '../entities/question.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DatabaseError } from 'src/common/error'
import { QuestionSet } from '../entities/question-set.entity'
import { plainToClass } from 'class-transformer'
import { CreateQuestionSetDto } from '../dto/create-question-set.dto'
import { QuestionGeminiService } from '../integrations/question-gemini.service'
import { QuestionStack } from '../entities/question-stack.entity'
import { TechStackQuestionDto } from '../dto/response-stack-question.dto'
import { ProjectQuestionDto } from '../dto/response-project-question.dto'

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(QuestionSet)
    private readonly questionSetRepository: Repository<QuestionSet>,
    private readonly geminiApiService: QuestionGeminiService
  ) {}

  /**
   * 질문 세트 생성 및 저장
   */
  public async createQuestion(dto: CreateQuestionDto): Promise<CreateQuestionSetDto> {
    const { tech_stack, projects } = await this.geminiApiService.generateQuestions(dto.text)
    const questionSet = QuestionSet.createQuestionSet(dto.text)

    // 프로젝트 질문 추가
    projects.forEach((project) => {
      project.questions.forEach(({ text, purpose }) => {
        const q = Question.createQuestion(project.project_name, text, purpose, questionSet)
        questionSet.addQuestion(q)
      })
    })

    // 기술 질문 추가
    tech_stack.forEach((tech) => {
      tech.questions.forEach(({ text, purpose }) => {
        const q = QuestionStack.createQuestionStack(tech.stack, text, purpose, questionSet)
        questionSet.addQuestionStack(q)
      })
    })

    const savedSet = await this.saveQuestionSet(questionSet)

    return this.toDto(savedSet)
  }

  /**
   * 질문 세트 저장
   */
  private async saveQuestionSet(questionSet: QuestionSet): Promise<QuestionSet> {
    try {
      return await this.questionSetRepository.save(questionSet)
    } catch (error) {
      throw new DatabaseError('데이터베이스 저장 실패: ' + error.message)
    }
  }

  /**
   * 엔티티를 DTO로 변환
   */
  private toDto(questionSet: QuestionSet): CreateQuestionSetDto {
    const questionSetDto = plainToClass(CreateQuestionSetDto, questionSet, {
      excludeExtraneousValues: true
    })
    questionSetDto.projectQuestions = questionSet.questions.map((q) =>
      plainToClass(
        ProjectQuestionDto,
        { id: q.id, projectName: q.projectName, question: q.question, purpose: q.purpose },
        { excludeExtraneousValues: true }
      )
    )
    questionSetDto.techStackQuestions = questionSet.questionStacks.map((s) =>
      plainToClass(
        TechStackQuestionDto,
        { id: s.id, stack: s.stackName, question: s.question, purpose: s.purpose },
        { excludeExtraneousValues: true }
      )
    )
    return questionSetDto
  }
}
