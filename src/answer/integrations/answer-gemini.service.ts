import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'crypto'
import { GeminiApiError } from 'src/common/error'
import { RedisService } from 'src/redis/redis.service'

@Injectable()
export class AnswerGeminiService {
  private readonly genAI: GoogleGenerativeAI
  private readonly model: GenerativeModel
  private readonly ttl: number

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    this.ttl = this.configService.get<number>('REDIS_TTL', 1800)
  }

  private generateCacheKey(originalQuestionId: string, userResponse: string): string {
    const hash = createHash('md5').update(`${originalQuestionId}:${userResponse}`).digest('hex')
    return `follow_up:v1:${hash}`
  }

  private buildPrompt(
    originalQuestionId: string,
    originalQuestionText: string,
    userResponse: string
  ): string {
    return `
     당신은 대화형 면접 전문가인 AI입니다. 사용자가 제공한 면접 질문에 대한 답변을 분석하여, 단일 후속 질문을 동적으로 생성하고, 면접관의 속마음을 JSON 형식으로 출력하세요. 후속 질문은 자연스러운 대화 톤으로, 답변에 즉각 반응하여 기술적 깊이를 탐구하거나 명확성을 요청해야 합니다. 평가 목적은 '기술 선택', '구현 방식', '문제 해결', '성과 평가' 중 하나로 제한됩니다.

     1. **입력 처리**:
        - 입력: 원본 질문 ID, 원본'</질문 텍스트, 사용자 답변.
        - 답변을 분석해 구체성, 기술적 깊이, 기술 스택, 프로젝트 맥락을 평가.

     2. **질문 생성 규칙**:
        - 답변이 구체적이면 기술적 세부 사항을 탐구하는 질문 생성.
        - 답변이 모호하면 명확성을 요청하는 질문 생성.
        - 질문은 원본 질문의 기술 스택과 맥락을 유지하며, 대화적 톤 사용 (예: '그 부분 좀 더 궁금한데...').
        - 면접관의 속마음: 답변에 대한 평가, 질문 의도, 추가로 파악하고 싶은 점 서술.

     3. **출력 형식**:
        {
          "follow_up": [
            {
              "original_question_id": "[원본 질문 ID]",
              "original_question_text": "[원본 질문 내용]",
              "user_response": "[사용자 답변]",
              "question": {
                "id": 1,
                "text": "[후속 질문 내용]",
                "purpose": "[기술 선택|구현 방식|문제 해결|성과 평가]"
              },
              "interviewer_thoughts": "[면접관의 속마음]"
            }
          ]
        }

     4. **대화 흐름**:
        - 답변이 없거나 유효하지 않으면 {'error': '유효한 답변이 제공되지 않았습니다.'} 반환.
        - 질문은 실제 면접관처럼 자연스럽게, 사용자를 더 깊은 대화로 이끌어야 함.

     입력:
     - 원본 질문 ID: ${originalQuestionId}
     - 원본 질문: ${originalQuestionText}
     - 사용자 답변: ${userResponse}

     위 입력을 기반으로 후속 질문과 면접관의 속마음을 JSON 형식으로 출력하세요. 마크다운은 포함시키지 마세요.
   `
  }

  public async generateFollowUp(
    originalQuestionId: string,
    originalQuestionText: string,
    userResponse: string,
    options: { cache?: boolean } = { cache: true },
  ): Promise<{
    follow_up: {
      original_question_id: string
      original_question_text: string
      user_response: string
      question: { id: number; text: string; purpose: string }
      interviewer_thoughts: string
    }[]
  }> {
    const cacheKey = this.generateCacheKey(originalQuestionId, userResponse)
    const cachedData = await this.redisService.get<{
      follow_up: {
        original_question_id: string
        original_question_text: string
        user_response: string
        question: { id: number; text: string; purpose: string }
        interviewer_thoughts: string
      }[]
    }>(cacheKey)
    if (cachedData) {
      console.log(`CacheKey: ${cacheKey}`)
      return cachedData
    }

    const prompt = this.buildPrompt(originalQuestionId, originalQuestionText, userResponse)
    const rawText = await this.getGeminiResponse(prompt)
    const result = this.parseGeminiResponse<{
      follow_up: {
        original_question_id: string
        original_question_text: string
        user_response: string
        question: { id: number; text: string; purpose: string }
        interviewer_thoughts: string
      }[]
    }>(rawText)

    if (!result.follow_up || result.follow_up.length !== 1) {
      throw new GeminiApiError('Gemini 응답에 follow_up이 누락되었거나 형식이 잘못되었습니다.')
    }
    const followUp = result.follow_up[0]
    if (
      !followUp.original_question_id ||
      !followUp.original_question_text ||
      !followUp.user_response ||
      !followUp.question ||
      !followUp.interviewer_thoughts
    ) {
      throw new GeminiApiError('Gemini 응답의 follow_up 형식이 유효하지 않습니다.')
    }
    if (!['기술 선택', '구현 방식', '문제 해결', '성과 평가'].includes(followUp.question.purpose)) {
      throw new GeminiApiError(`질문 ${followUp.question.text}의 purpose가 유효하지 않습니다.`)
    }

    await this.redisService.set(cacheKey, result, this.ttl)
    console.log(`저장된 CacheKey: ${cacheKey}`)

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
    } catch (error) {
      throw new GeminiApiError('Gemini 응답 파싱 실패: ' + error.message)
    }
  }
}
