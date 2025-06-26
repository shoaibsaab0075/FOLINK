import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Feedback } from '../entities/feedback.entity'
import { Conversation } from 'src/answer/entities/conversation.entity'
import { Repository } from 'typeorm'
import {
  FEEDBACK_GENERATOR_TOKEN,
  IFeedbackGenerator
} from '../interfaces/feedback-generator.interface'
import { ApiResponseUtil } from 'src/common/utils/api-response.util'
import { StatusType } from 'src/answer/enum/status.type'

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @Inject(FEEDBACK_GENERATOR_TOKEN)
    private readonly feedbackGenerator: IFeedbackGenerator
  ) {}

  async generateAndSaveFeedback(conversationId: number): Promise<Feedback> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['messages']
    })
    console.log(
      'Conversation:',
      conversation,
      'ID:',
      conversationId,
      'Status:',
      conversation?.status
    )
    if (!conversation) {
      throw ApiResponseUtil.error('대화를 찾을 수 없습니다.', HttpStatus.NOT_FOUND, {
        code: 'CONVERSATION_NOT_FOUND',
        details: '해당 ID의 대화가 존재하지 않습니다.'
      })
    }
    if (conversation.status !== StatusType.END) {
      throw ApiResponseUtil.error(
        '피드백을 생성하려면 대화가 종료되어야 합니다.',
        HttpStatus.BAD_REQUEST,
        {
          code: 'CONVERSATION_NOT_ENDED',
          details: '대화가 아직 종료되지 않았습니다. 대화를 종료한 후 피드백을 생성하세요.'
        }
      )
    }

    const messages = conversation.messages
    const feedbackJson = JSON.parse(
      await this.feedbackGenerator.generateFinalFeedback(conversationId, messages)
    )

    const feedback = Feedback.createFeedback(
      conversation,
      feedbackJson.content,
      feedbackJson.strengths,
      feedbackJson.overallImpression,
      feedbackJson.improvementPoints,
      feedbackJson.additionalAdvice
    )

    return this.feedbackRepository.save(feedback)
  }

  async getFeedbackByConversationId(conversationId: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { conversation: { id: conversationId } }
    })
    if (!feedback) {
      throw ApiResponseUtil.error('피드백을 찾을 수 없습니다.', HttpStatus.NOT_FOUND, {
        code: 'FEEDBACK_NOT_FOUND',
        details: '해당 대화에 대한 피드백이 존재하지 않습니다.'
      })
    }
    return feedback
  }
}
