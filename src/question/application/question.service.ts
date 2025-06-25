// question/application/question.service.ts
import { HttpStatus, Injectable } from '@nestjs/common'
import { CreateQuestionDto } from '../dto/create-question.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DatabaseError } from 'src/common/error'
import { QuestionSet } from '../entities/question-set.entity'
import { CreateQuestionSetDto } from '../dto/create-question-set.dto'
import { QuestionGeminiService } from '../integrations/question-gemini.service'
import { QuestionStack } from '../entities/question-stack.entity'
import { TechStackQuestionDto } from '../dto/response-stack-question.dto'
import { ProjectQuestionDto } from '../dto/response-project-question.dto'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Conversation } from 'src/answer/entities/conversation.entity'
import { QuestionCreatedEvent } from '../events/question-created.event'
import { DtoMapper } from 'src/common/util/dto-mapper'
import { Question } from '../entities/question.entity'
import { Message } from 'src/answer/entities/message.entity'
import { QuestionType } from '../enum/question.type'
import { MessageType } from 'src/answer/enum/message.type'
import { ApiResponseUtil } from 'src/common/util/api-response.util'
import * as pdfParse from 'pdf-parse'
import e from 'express'

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(QuestionSet) private readonly questionSetRepository: Repository<QuestionSet>,
    @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionStack)
    private readonly questionStackRepository: Repository<QuestionStack>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly geminiApiService: QuestionGeminiService
  ) {}

  // 텍스트 정제 유틸리티 함수
  private sanitizeText(text: string): string {
    // 널 바이트 및 제어 문자 제거
    return text
      .replace(/\0/g, '') // 널 바이트 제거
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 제어 문자 제거
      .trim()
  }

  public async getLatestQuestionSet(): Promise<CreateQuestionSetDto> {
    const questionSets = await this.questionSetRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
      relations: ['questions', 'questionStacks']
    })
    if (!questionSets.length) throw new DatabaseError('질문 세트가 없습니다.')
    return this.toDto(questionSets[0])
  }

  public async createQuestion(dto: CreateQuestionDto): Promise<CreateQuestionSetDto> {
    // 입력 텍스트 정제
    const sanitizedUserResponse = this.sanitizeText(dto.userResponse)
    if (!sanitizedUserResponse) {
      throw ApiResponseUtil.error('유효한 텍스트가 없습니다', HttpStatus.BAD_REQUEST)
    }

    const { tech_stack, projects } =
      await this.geminiApiService.generateQuestions(sanitizedUserResponse)
    const questionSet = await this.questionSetRepository.save(
      QuestionSet.createQuestionSet(sanitizedUserResponse)
    )

    const savedQuestions = await Promise.all(
      projects.flatMap((project) =>
        project.questions.map(async ({ text, purpose }) => {
          const sanitizedText = this.sanitizeText(text)
          const sanitizedPurpose = this.sanitizeText(purpose)
          if (!sanitizedText || !sanitizedPurpose) {
            throw ApiResponseUtil.error(
              '유효하지 않은 질문 또는 목적 텍스트',
              HttpStatus.BAD_REQUEST
            )
          }

          const conversation = await this.createConversation(
            null,
            sanitizedText,
            QuestionType.PROJECT
          )
          const question = Question.createQuestion(
            this.sanitizeText(project.project_name),
            sanitizedText,
            sanitizedPurpose,
            questionSet
          )
          question.conversationId = conversation.id
          const savedQuestion = await this.questionRepository.save(question)

          conversation.originalQuestionId = savedQuestion.id.toString()
          await this.conversationRepository.save(conversation)

          return savedQuestion
        })
      )
    )

    const savedStacks = await Promise.all(
      tech_stack.flatMap((tech) =>
        tech.questions.map(async ({ text, purpose }) => {
          const sanitizedText = this.sanitizeText(text)
          const sanitizedPurpose = this.sanitizeText(purpose)
          if (!sanitizedText || !sanitizedPurpose) {
            throw ApiResponseUtil.error(
              '유효하지 않은 질문 또는 목적 텍스트',
              HttpStatus.BAD_REQUEST
            )
          }

          const conversation = await this.createConversation(
            null,
            sanitizedText,
            QuestionType.TECH_STACK
          )
          const questionStack = QuestionStack.createQuestionStack(
            this.sanitizeText(tech.stack),
            sanitizedText,
            sanitizedPurpose,
            questionSet
          )
          questionStack.conversationId = conversation.id
          const savedStack = await this.questionStackRepository.save(questionStack)

          conversation.originalQuestionId = savedStack.id.toString()
          await this.conversationRepository.save(conversation)

          return savedStack
        })
      )
    )

    const questionSetDto = this.toDto(questionSet)
    questionSetDto.projectQuestions = DtoMapper.toDtoArray(ProjectQuestionDto, savedQuestions)
    questionSetDto.techStackQuestions = DtoMapper.toDtoArray(TechStackQuestionDto, savedStacks)
    return questionSetDto
  }

  private async createConversation(
    questionId: number | null,
    questionText: string,
    type: QuestionType
  ): Promise<Conversation> {
    const tempId = questionId?.toString() ?? `temp-${type}-${Date.now()}`
    const conversation = Conversation.createConversation(tempId, questionText, type)
    const savedConversation = await this.conversationRepository.save(conversation)

    const initialMessage = Message.createMessage(questionText, MessageType.AI)
    initialMessage.conversation = savedConversation
    await this.messageRepository.save(initialMessage)

    return savedConversation
  }

  public async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer)
      const text = this.sanitizeText(data.text)
      if (!text) {
        throw new Error('PDF에서 유효한 텍스트를 추출하지 못했습니다')
      }
      return text
    } catch (error: any) {
      throw ApiResponseUtil.error(`PDF 텍스트 추출 실패: ${error.message}`, HttpStatus.BAD_REQUEST)
    }
  }

  public async getQuestionsById(id: number): Promise<CreateQuestionSetDto> {
    const questionSet = await this.questionSetRepository.findOne({
      where: { id },
      relations: ['questions', 'questionStacks']
    })
    if (!questionSet) {
      throw ApiResponseUtil.error(`질문 세트를 찾을 수 없습니다. ID: ${id}`, HttpStatus.NOT_FOUND)
    }
    return this.toDto(questionSet)
  }

  private toDto(questionSet: QuestionSet): CreateQuestionSetDto {
    const questionSetDto = DtoMapper.toDto(CreateQuestionSetDto, questionSet)
    questionSetDto.projectQuestions = DtoMapper.toDtoArray(
      ProjectQuestionDto,
      questionSet.questions ?? []
    )
    questionSetDto.techStackQuestions = DtoMapper.toDtoArray(
      TechStackQuestionDto,
      questionSet.questionStacks ?? []
    )
    return questionSetDto
  }
}
