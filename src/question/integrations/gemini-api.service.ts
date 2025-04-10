import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GeminiApiError } from 'src/common/error'
import { RedisService } from 'src/redis/redis.service'
import { createHash } from 'crypto'

@Injectable()
export class GeminiApiService {
  private readonly genAI: GoogleGenerativeAI
  private readonly model: GenerativeModel
  private readonly ttl: number

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    this.ttl = this.configService.get<number>('REDIS_TTL', 3600) // 1시간 (초 단위) 후에 자동 삭제
  }

  /**
   * 캐시 키 생성 후 암호화 (text를 기반으로 고유한 키 생성)
   */
  private generateCacheKey(text: string): string {
    const hash = createHash('md5').update(text).digest('hex')
    return `questions:${hash}`
  }

  /**
   * 동일한 텍스트에 대해 반복적으로 API 호출 방지 - 캐싱
   * 텍스트를 기반으로 재미나이 API를 호출해 질문을 생성
   */
  public async generateQuestions(text: string): Promise<{ title: string; question: string }[]> {
    const cacheKey = this.generateCacheKey(text)

    // 캐시에서 데이터 조회
    const cachedQuestions = await this.redisService.get<{ title: string; question: string }[]>(cacheKey)
    if (cachedQuestions) {
      console.log(`CacheKey: ${cacheKey}`)
      return cachedQuestions
    }

    const prompt = this.buildPrompt(text)
    const rawText = await this.getGeminiResponse(prompt)
    const questions = this.parseGeminiResponse(rawText)

    // 캐시에 저장 (TTL 설정 포함)
    await this.redisService.set(cacheKey, questions, this.ttl)
    console.log(`저장된 CacheKey: ${cacheKey}`)

    return questions
  }

  /**
   * 프롬프트 작성
   */
  private buildPrompt(text: string): string {
    return `
         ${text}
         위 내용을 바탕으로 사용자에게 물어볼 수 있는 관련 질문을 3개 생성해주세요.
         반드시 유효한 JSON 형식으로 응답하며, 배열 형태로 반환하세요:
         [
         { "title": "질문 제목 1", "question": "질문 내용 1" },
         { "title": "질문 제목 2", "question": "질문 내용 2" },
         { "title": "질문 제목 3", "question": "질문 내용 3" }
         ]
         마크다운(예: \`\`\`json)이나 추가 텍스트는 포함시키지 마세요.
      `
  }

  /**
   * 제미나이 API를 호출해서 프롬프트에 대한 응답 생성
   */
  private async getGeminiResponse(prompt: string): Promise<string> {
    // 질문 생성 부분 - generateContent메서드는 프롬프트에 대한 답변 생성을 함
    const result = await this.model.generateContent(prompt)
    const response = await result.response
    const rawText = response.text()
    console.log('Raw Gemini response:', rawText)

    return rawText
  }

  /**
   * 응답에서 마크다운(```json 등)을 제거하고 JSON을 파싱해 title과 question을 추출
   */
  private parseGeminiResponse(rawText: string): { title: string; question: string }[] {
    try {
      const cleanedText = rawText.replace(/```json|```/g, '').trim()
      console.log('Cleaned response:', cleanedText)
      return JSON.parse(cleanedText)
    } catch (error) {
      throw new GeminiApiError('Gemini 응답 파싱 실패: ' + error.message)
    }
  }
}
