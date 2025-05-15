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
    const { tech_stack, projects } = await this.geminiApiService.generateQuestions(dto.text)
    const questionSet = QuestionSet.createQuestionSet(dto.text)

    projects.forEach((project) =>
      project.questions.forEach(({ text, purpose }) =>
        questionSet.addQuestion(
          Question.createQuestion(project.project_name, text, purpose, questionSet)
        )
      )
    )
    tech_stack.forEach((tech) =>
      tech.questions.forEach(({ text, purpose }) =>
        questionSet.addQuestionStack(
          QuestionStack.createQuestionStack(tech.stack, text, purpose, questionSet)
        )
      )
    )

    const savedSet = await this.questionSetRepository.save(questionSet)

    const savedQuestions = await Promise.all(
      savedSet.questions.map(async (q) => {
        const conversation = await this.createConversation(q.id, q.question as MessageType, QuestionType.PROJECT)
        q.conversationId = conversation.id
        return this.questionRepository.save(q)
      })
    )

    const savedStacks = await Promise.all(
      savedSet.questionStacks.map(async (q) => {
        const conversation = await this.createConversation(q.id, q.question as MessageType, QuestionType.TECH_STACK)
        q.conversationId = conversation.id
        return this.questionStackRepository.save(q)
      })
    )

    const questionSetDto = this.toDto(savedSet)
    questionSetDto.projectQuestions = DtoMapper.toDtoArray(ProjectQuestionDto, savedQuestions)
    questionSetDto.techStackQuestions = DtoMapper.toDtoArray(TechStackQuestionDto, savedStacks)
    return questionSetDto
  }

  public async getQuestionsById(id: number): Promise<CreateQuestionSetDto> {
    const questionSet = await this.questionSetRepository.findOne({
      where: { id },
      relations: ['questions', 'questionStacks']
    })
    if (!questionSet) throw new DatabaseError('질문 세트를 찾을 수 없습니다')
    return this.toDto(questionSet)
  }

  private async createConversation(
    questionId: number,
    questionText: MessageType,
    type: QuestionType
  ): Promise<Conversation> {
    const conversation = Conversation.createConversation(
      questionId.toString(),
      questionText,
      type
    )
    const savedConversation = await this.conversationRepository.save(conversation)
    const initialMessage = Message.createMessage(questionText, MessageType.AI)
    initialMessage.conversation = savedConversation
    savedConversation.addMessage(initialMessage)
    await this.messageRepository.save(initialMessage)
    return savedConversation
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
