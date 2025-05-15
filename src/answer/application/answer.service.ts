import { Injectable, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Conversation } from '../entities/conversation.entity'
import { Message } from '../entities/message.entity'
import { MessageType } from '../enum/message.type'
import { AnswerGeminiService } from '../integrations/answer-gemini.service'
import { MessageResponseDto } from '../dto/message/message-response.dto'
import { DtoMapper } from 'src/common/util/dto-mapper'
import { StatusType } from '../enum/status.type'
import { ApiResponseUtil } from 'src/common/util/api-response.util'
import { Question } from 'src/question/entities/question.entity'

@Injectable()
export class AnswerService {
  private readonly MAX_MESSAGE_COUNT = 8
  private readonly END_MESSAGE = '좋습니다. 다음 질문으로 넘어가시죠'

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly answerGeminiService: AnswerGeminiService,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>
  ) {}

  public async handleConversation(
    conversationId: number,
    userResponse: string
  ): Promise<MessageResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['messages']
    })
    if (!conversation) throw ApiResponseUtil.error('대화를 찾을 수 없습니다.', HttpStatus.NOT_FOUND)
    if (conversation.status === StatusType.END)
      throw ApiResponseUtil.error('이미 종료된 대화입니다.', HttpStatus.BAD_REQUEST)

    return this.messageRepository.manager.transaction(async (manager) => {
      const messageRepo = manager.getRepository(Message)
      const messages: Message[] = [...conversation.messages]

      // 마지막 AI 질문 가져오기
      const lastQuestion =
        messages
          .filter((m) => m.type === MessageType.AI)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.content ||
        conversation.originalQuestionText

      // 사용자 메시지 추가
      const userMessage = Message.createMessage(userResponse, MessageType.USER)
      userMessage.conversation = conversation // Conversation 연결
      messages.push(userMessage)
      await messageRepo.save(userMessage)

      // Gemini API 호출로 다음 질문 생성 (사용자 응답 포함)
      const geminiResponse = await this.answerGeminiService.generateNextStep(
        conversation.originalQuestionId,
        lastQuestion,
        userResponse,
        { cache: false }
      )

      const aiMessage = Message.createMessage(
        geminiResponse.next_step[0].question.text,
        MessageType.AI,
        geminiResponse.next_step[0].evaluator_feedback
      )
      aiMessage.conversation = conversation // Conversation 연결
      messages.push(aiMessage)
      await messageRepo.save(aiMessage)

      conversation.messages = messages

      // 대화 종료 조건 체크
      if (conversation.messages.length >= this.MAX_MESSAGE_COUNT) {
        const endMessage = Message.createMessage(this.END_MESSAGE, MessageType.AI)
        endMessage.conversation = conversation // Conversation 연결
        conversation.addMessage(endMessage)
        await messageRepo.save(endMessage)
        conversation.endConversation()
        await manager.save(conversation)
      } else {
        await manager.save(conversation) // 종료 조건이 아니면 변경된 메시지 목록 저장
      }

      // 최신 대화 상태 로드 (이미 트랜잭션 내에서 업데이트되었으므로 그대로 사용 가능)
      return this.buildResponse(conversation)
    })
  }

  private async buildResponse(conversation: Conversation): Promise<MessageResponseDto> {
    if (!conversation.messages) {
      conversation.messages = []
    }

    const isEnded =
      conversation.status === StatusType.END ||
      conversation.messages.length >= this.MAX_MESSAGE_COUNT

    // Original Question ID에서 숫자 부분 추출
    const originalQuestionIdNumber = parseInt(
      conversation.originalQuestionId.match(/\d+/)?.[0] || '1'
    )
    const originalQuestion = await this.questionRepository.findOne({
      where: { id: originalQuestionIdNumber }
    })

    // MessageResponseDto로 변환
    const response = DtoMapper.toDto(MessageResponseDto, {
      id: conversation.id,
      original_question: {
        id: originalQuestion?.id || originalQuestionIdNumber, // 실제 Question ID 사용
        type: conversation.questionType,
        text: conversation.originalQuestionText
      },
      messages: conversation.messages.map((m, index) => {
        const messageResponse = {
          id: m.id,
          type: m.type,
          content: m.content,
          created_at: m.createdAt.toISOString(),
          evaluator_feedback: m.evaluatorFeedback || null
        }
        // 첫 번째 메시지의 type과 content 수정
        if (index === 0 && m.type !== MessageType.USER) {
          messageResponse.type = MessageType.AI
          messageResponse.content = conversation.originalQuestionText
        }
        return messageResponse
      }),
      status: isEnded ? StatusType.END : StatusType.ON_GOING
    })

    return response
  }
}
