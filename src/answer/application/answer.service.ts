import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateAnswerDto } from '../dto/answer/create-answer.dto'
import { UpdateAnswerDto } from '../dto/answer/update-answer.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Answer } from '../entities/answer.entity'
import { Repository } from 'typeorm'
import { FollowUp } from '../entities/follow-up.entity'
import { Question } from 'src/question/entities/question.entity'
import { QuestionStack } from 'src/question/entities/question-stack.entity'
import { AnswerGeminiService } from '../integrations/answer-gemini.service'
import { plainToClass } from 'class-transformer'
import { Conversation } from '../entities/conversation.entity'
import { ResponseConversationHistoryDto } from '../dto/conversations/response-conversation-history.dto'
import { ResponseAllConversationsDto } from '../dto/conversations/response-all-conversations.dto'
import { ResponseConversationStepDto } from '../dto/conversations/response-conversation-step.dto'

@Injectable()
export class AnswerService {
  private readonly MAX_ITERATIONS = 4
  private readonly COMPLETION_MESSAGE =
    '알겠습니다. 일단 이정도면 충분할 것 같습니다. 다음 질문으로 넘어가겠습니다.'

  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionStack)
    private readonly questionStackRepository: Repository<QuestionStack>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
    private readonly answerGeminiService: AnswerGeminiService
  ) {}

  /**
   * 초기 대화 시작: 질문을 받아 첫 번째 답변 처리
   */
  public async processConversationSimple(
    questionType: 'techStack' | 'project',
    questionId: string,
    createAnswerDto: CreateAnswerDto
  ): Promise<ResponseConversationHistoryDto> {
    const { questionText, originalQuestionId, purpose } = await this.fetchQuestion(
      questionType,
      questionId
    )
    const conversation = await this.createConversation(originalQuestionId, questionText)

    const conversationStep = await this.processAnswerAndFollowUp(
      conversation,
      createAnswerDto.userResponse,
      originalQuestionId,
      questionText,
      purpose
    )

    return this.buildConversationHistory(conversation, [conversationStep], null)
  }

  /**
   * 대화 이어가기: 후속 질문에 대한 답변 처리
   */
  public async continueConversation(
    conversationId: number,
    userResponse: string
  ): Promise<ResponseConversationHistoryDto> {
    const conversation = await this.fetchConversation(conversationId)

    return this.answerRepository.manager.transaction(async (transactionalEntityManager) => {
      const answer = Answer.createAnswer(
        conversation.originalQuestionId,
        conversation.originalQuestionText,
        userResponse
      )
      answer.conversation = conversation
      await transactionalEntityManager.save(answer)

      const allAnswers = await transactionalEntityManager.find(Answer, {
        where: {
          conversation: {
            id: conversation.id
          }
        },
        relations: ['conversation']
      })

      if (allAnswers.length < this.MAX_ITERATIONS) {
        const geminiResponse = await this.answerGeminiService.generateFollowUp(
          conversation.originalQuestionId,
          conversation.originalQuestionText,
          userResponse,
          { cache: false }
        )
        const followUpData = geminiResponse.follow_up[0]
        const followUp = FollowUp.createFollowUp(
          followUpData.question.text,
          followUpData.question.purpose,
          followUpData.interviewer_thoughts,
          answer
        )
        await transactionalEntityManager.save(followUp)
      }

      // 트랜잭션 외부에서 최신 데이터 조회
      const conversationSteps = await this.buildConversationSteps(conversation)

      const completionMessage =
        conversationSteps.length >= this.MAX_ITERATIONS ? this.COMPLETION_MESSAGE : null

      conversation.completionMessage = completionMessage
      await this.conversationRepository.save(conversation)

      return this.buildConversationHistory(conversation, conversationSteps, completionMessage)
    })
  }

  /**
   * 모든 대화 조회
   */
  public async getAllConversations(): Promise<ResponseAllConversationsDto> {
    const conversations = await this.conversationRepository.find()
    const conversationDtos = await Promise.all(
      conversations.map(async (conv) => {
        const steps = await this.buildConversationSteps(conv)
        return this.buildConversationHistory(conv, steps, conv.completionMessage)
      })
    )

    return plainToClass(ResponseAllConversationsDto, { conversations: conversationDtos })
  }

  /**
   * 질문 조회
   */
   public async fetchQuestion(
    questionType: 'techStack' | 'project',
    questionId: string
  ): Promise<{ questionText: string; originalQuestionId: string; purpose: string }> {
    const [baseId] = questionId.split(':')
    const parsedId = parseInt(baseId)

    if (questionType === 'techStack') {
      const questionStack = await this.questionStackRepository.findOne({
        where: { id: parsedId }
      })
      if (!questionStack) {
        return null // 컨트롤러에서 처리
      }
      return {
        questionText: questionStack.question,
        originalQuestionId: `techStackQuestions[${questionId}]`,
        purpose: questionStack.purpose
      }
    }

    const question = await this.questionRepository.findOne({
      where: { id: parsedId }
    })
    if (!question) {
      return null // 컨트롤러에서 처리
    }
    return {
      questionText: question.question,
      originalQuestionId: `projectQuestions[${questionId}]`,
      purpose: question.purpose
    }
  }

  /**
   * 대화 세션 생성
   */
  public async createConversation(
    originalQuestionId: string,
    questionText: string
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      originalQuestionId,
      originalQuestionText: questionText
    })
    return this.conversationRepository.save(conversation)
  }

  /**
   * 대화 세션 조회
   */
  public async fetchConversation(conversationId: number): Promise<Conversation> {
    return this.conversationRepository.findOne({
      where: { id: conversationId }
    })
  }

  /**
   * 답변 및 후속 질문 처리
   */
  public async processAnswerAndFollowUp(
    conversation: Conversation,
    userResponse: string,
    originalQuestionId: string,
    questionText: string,
    purpose: string
  ): Promise<ResponseConversationStepDto> {
    const answer = Answer.createAnswer(originalQuestionId, questionText, userResponse)
    answer.conversation = conversation
    await this.answerRepository.save(answer)

    const allAnswers = await this.answerRepository.find({
      where: {
        conversation: {
          id: conversation.id
        }
      }
    })

    if (allAnswers.length >= this.MAX_ITERATIONS) {
      return plainToClass(ResponseConversationStepDto, {
        answer: {
          id: answer.id,
          user_response: answer.userResponse,
          created_at: answer.createdAt
        },
        follow_up: undefined
      })
    }

    const geminiResponse = await this.answerGeminiService.generateFollowUp(
      originalQuestionId,
      questionText,
      userResponse,
      { cache: false }
    )
    const followUpData = geminiResponse.follow_up[0]
    const followUp = FollowUp.createFollowUp(
      followUpData.question.text,
      followUpData.question.purpose,
      followUpData.interviewer_thoughts,
      answer
    )
    await this.followUpRepository.save(followUp)

    return plainToClass(ResponseConversationStepDto, {
      answer: {
        id: answer.id,
        user_response: answer.userResponse,
        created_at: answer.createdAt
      },
      follow_up: {
        id: followUp.id,
        question: {
          id: followUp.id,
          text: followUp.text,
          purpose: followUp.purpose
        },
        interviewer_thoughts: followUp.interviewerThoughts,
        created_at: followUp.createdAt
      }
    })
  }

  /**
   * 대화 기록 생성
   */
  private async buildConversationSteps(
    conversation: Conversation
  ): Promise<ResponseConversationStepDto[]> {
    const allAnswers = await this.answerRepository.find({
      where: {
        conversation: {
          id: conversation.id
        }
      },
      relations: ['conversation'],
      cache: false // 캐싱 비활성화
    })

    return Promise.all(
      allAnswers.map(async (answer) => {
        const followUp = await this.followUpRepository.findOne({
          where: {
            answer: {
              id: answer.id
            }
          },
          relations: ['answer']
        })

        return plainToClass(ResponseConversationStepDto, {
          answer: {
            id: answer.id,
            user_response: answer.userResponse,
            created_at: answer.createdAt
          },
          follow_up: followUp
            ? {
                id: followUp.id,
                question: {
                  id: followUp.id,
                  text: followUp.text,
                  purpose: followUp.purpose
                },
                interviewer_thoughts: followUp.interviewerThoughts,
                created_at: followUp.createdAt
              }
            : undefined
        })
      })
    )
  }

  /**
   * 대화 히스토리 DTO 생성
   */
  public buildConversationHistory(
    conversation: Conversation,
    conversationSteps: ResponseConversationStepDto[],
    completionMessage: string | null
  ): ResponseConversationHistoryDto {
    return plainToClass(ResponseConversationHistoryDto, {
      original_question_id: conversation.originalQuestionId,
      original_question_text: conversation.originalQuestionText,
      conversation: conversationSteps,
      completionMessage,
      conversationId: conversation.id
    })
  }

  // `COMPLETION_MESSAGE`를 컨트롤러에서 사용하기 위해 getter 추가
  public getCompletionMessage(): string {
    return this.COMPLETION_MESSAGE
  }
}
