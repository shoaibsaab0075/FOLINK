import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from 'src/redis/redis.service'
import { Message } from 'src/answer/entities/message.entity'
import { IFeedbackGenerator } from '../interfaces/feedback-generator.interface'
import { CacheKeyGenerator } from 'src/common/utils/cache-key-generator'
import { GeminiApiError } from 'src/common/errors'

@Injectable()
export class FeedbackGeminiService implements IFeedbackGenerator {
  private readonly genAI: GoogleGenerativeAI
  private readonly model: GenerativeModel
  private readonly ttl: number

  constructor(
    @Optional() private readonly redisService: RedisService | undefined,
    private readonly configService: ConfigService
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) // 모델명 확인
    this.ttl = this.configService.get<number>('REDIS_TTL', 1800)
  }

  private generateCacheKey(conversationId: number, messages: string): string {
    return CacheKeyGenerator.generateKey('final_feedback', conversationId.toString(), messages)
  }

  private buildFeedbackPrompt(messages: Message[]): string {
    const messageContent = messages.map((m) => `${m.type}: ${m.content}`).join('\n')
    return `
      당신은 대화형 면접 전문가 AI입니다. 주어진 대화 내용을 기반으로 최종 피드백을 JSON 형식으로 생성하세요.
      대화 내용:
      ${messageContent}

      요구사항:
      - JSON 객체에 다음 필드를 포함:
        - "content": 전반적인 전체 피드백 (문자열)
        - "strengths": 강점 (문자열)
        - "improvementPoints": 개선점 (문자열)
        - "overallImpression": 면접관 관점에서의 전체적인 인상 (문자열)
        - "additionalAdvice": 추가 조언 (문자열)
      - 출력은 JSON 형식으로만 제공. 마크다운이나 기타 형식을 사용하지 마세요.

      위 입력을 기반으로 피드백을 JSON 형식으로 출력하세요.
    `
  }

  async generateFinalFeedback(conversationId: number, messages: Message[]): Promise<string> {
    if (!messages.length) {
      throw new GeminiApiError('대화 메시지가 없습니다.')
    }

    const cacheKey = this.generateCacheKey(conversationId, JSON.stringify(messages))
    if (this.redisService) {
      const cachedFeedback = await this.redisService.get<string>(cacheKey)
      if (cachedFeedback) {
        console.log(`Cache hit for feedback: ${cacheKey}`)
        return cachedFeedback
      }
    }

    const prompt = this.buildFeedbackPrompt(messages)
    const rawText = await this.getGeminiResponse(prompt)
    const feedbackJson = this.parseGeminiResponse<{
      content: string
      strengths: string
      improvementPoints: string
      overallImpression: string
      additionalAdvice: string
    }>(rawText)

    if (
      !feedbackJson.content ||
      !feedbackJson.strengths ||
      !feedbackJson.improvementPoints ||
      !feedbackJson.overallImpression ||
      !feedbackJson.additionalAdvice
    ) {
      throw new GeminiApiError('Gemini 응답에 필수 필드가 누락되었습니다.')
    }

    const result = JSON.stringify(feedbackJson)
    if (this.redisService) {
      await this.redisService.set(cacheKey, result, this.ttl)
      console.log(`Cached feedback for ${cacheKey}`)
    }
    return result
  }

  private async getGeminiResponse(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt)
    const response = result.response
    const rawText = response.text()
    console.log('Raw Gemini response:', rawText)
    return rawText
  }

  private parseGeminiResponse<T>(rawText: string): T {
    try {
      const cleanedText = rawText.replace(/```json|```/g, '').trim()
      console.log('Cleaned response:', cleanedText)
      return JSON.parse(cleanedText)
    } catch (error: any) {
      console.error('Gemini 응답 파싱 실패:', error, 'Raw Text:', rawText)
      throw new GeminiApiError('Gemini 응답 파싱 실패: ' + error.message)
    }
  }
}
