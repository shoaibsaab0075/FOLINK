import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GeminiApiError } from 'src/common/errors'
import { CacheKeyGenerator } from 'src/common/utils/cache-key-generator'
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
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) // 모델명 확인 필요 (gemini-2.0-flash -> gemini-1.5-flash 등 최신 모델 고려)
    this.ttl = this.configService.get<number>('REDIS_TTL', 1800)
  }

  // 캐시 키 생성 시, 이전 AI 질문의 내용(originalQuestionText)을 포함하여 동일한 사용자 응답이라도 맥락에 따라 다른 캐시를 사용하도록 합니다.
  private generateCacheKey(
    originalQuestionId: string,
    lastAiQuestionText: string,
    userResponse: string
  ): string {
    return CacheKeyGenerator.generateKey(
      'next_step:v2',
      originalQuestionId,
      lastAiQuestionText,
      userResponse
    )
  }

  private buildPrompt(
    originalQuestionId: string,
    originalQuestionText: string, // 이 파라미터는 이제 lastAiQuestionText로 사용됩니다.
    userResponse: string
  ): string {
    return `
     당신은 대화형 면접 전문가인 AI입니다. 사용자가 제공한 면접 질문에 대한 답변을 분석하여, 단일 후속 질문을 동적으로 생성하고, 평가자의 피드백을 JSON 형식으로 출력하세요. 후속 질문은 자연스러운 대화 톤으로, 답변에 즉각 반응하여 기술적 깊이를 탐구하거나 명확성을 요청해야 합니다. 평가 목적은 '기술 선택', '구현 방식', '문제 해결', '성과 평가' 중 하나로 제한됩니다.

     1. **입력 처리**:
        - 입력: 원본 질문 ID, 이전 AI 질문 텍스트, 사용자 답변.
        - 답변을 분석해 구체성, 기술적 깊이, 기술 스택, 프로젝트 맥락을 평가.

     2. **질문 생성 규칙**:
        - 답변이 구체적이면 기술적 세부 사항을 탐구하는 질문 생성.
        - 답변이 모호하면 명확성을 요청하는 질문 생성.
        - 질문은 이전 AI 질문의 기술 스택과 맥락을 유지하며, 대화적 톤 사용 (예: '그 부분 좀 더 궁금한데...').
        - 평가자의 피드백: 답변에 대한 평가, 질문 의도, 추가로 파악하고 싶은 점 서술.

     3. **출력 형식**:
        {
          "next_step": [
            {
              "original_question_id": "[원본 질문 ID]",
              "original_question_text": "[이전 AI 질문 내용]",
              "user_response": "[사용자 답변]",
              "question": {
                "id": 1, // 이 ID는 Gemini가 생성하는 내부 식별자이며, 실제 DB ID와는 다릅니다.
                "text": "[후속 질문 내용]",
                "purpose": "[기술 선택|구현 방식|문제 해결|성과 평가]"
              },
              "evaluator_feedback": "[평가자의 피드백]"
            }
          ]
        }

     4. **대화 흐름**:
        - 답변이 없거나 유효하지 않으면 {'error': '유효한 답변이 제공되지 않았습니다.'} 반환.
        - 질문은 실제 면접관처럼 자연스럽게, 사용자를 더 깊은 대화로 이끌어야 함.

     입력:
     - 원본 질문 ID: ${originalQuestionId}
     - 이전 AI 질문: ${originalQuestionText}
     - 사용자 답변: ${userResponse}

     위 입력을 기반으로 후속 질문과 평가자의 피드백을 JSON 형식으로 출력하세요. 마크다운은 포함시키지 마세요.
   `
  }

  public async generateNextStep(
    originalQuestionId: string,
    lastAiQuestionText: string, // originalQuestionText 파라미터 이름을 명확하게 변경
    userResponse: string,
    options: { cache?: boolean } = { cache: true }
  ): Promise<{
    next_step: {
      original_question_id: string
      original_question_text: string // Gemini 응답 필드명 유지
      user_response: string
      question: { id: number; text: string; purpose: string }
      evaluator_feedback: string
    }[]
  }> {
    const cacheKey = this.generateCacheKey(originalQuestionId, lastAiQuestionText, userResponse)

    if (options.cache !== false) {
      const cachedData = await this.redisService.get<{
        next_step: {
          original_question_id: string
          original_question_text: string
          user_response: string
          question: { id: number; text: string; purpose: string }
          evaluator_feedback: string
        }[]
      }>(cacheKey)
      if (cachedData) {
        console.log(`CacheKey (HIT): ${cacheKey}`)
        return cachedData
      }
    } else {
      console.log(`CacheKey (SKIPPED): ${cacheKey}`)
    }

    const prompt = this.buildPrompt(originalQuestionId, lastAiQuestionText, userResponse)
    const rawText = await this.getGeminiResponse(prompt)
    const result = this.parseGeminiResponse<{
      next_step: {
        original_question_id: string
        original_question_text: string
        user_response: string
        question: { id: number; text: string; purpose: string }
        evaluator_feedback: string
      }[]
    }>(rawText)

    if (!result.next_step || result.next_step.length !== 1) {
      throw new GeminiApiError('Gemini 응답에 next_step이 누락되었거나 형식이 잘못되었습니다.')
    }
    const nextStep = result.next_step[0]
    if (
      !nextStep.original_question_id ||
      // nextStep.original_question_text 는 Gemini 프롬프트에 따라 이전 AI 질문이 들어가므로, 값 존재 유무만 체크 가능
      nextStep.original_question_text === undefined ||
      !nextStep.user_response ||
      !nextStep.question ||
      !nextStep.evaluator_feedback
    ) {
      throw new GeminiApiError('Gemini 응답의 next_step 형식이 유효하지 않습니다.')
    }
    if (!['기술 선택', '구현 방식', '문제 해결', '성과 평가'].includes(nextStep.question.purpose)) {
      throw new GeminiApiError(`질문 ${nextStep.question.text}의 purpose가 유효하지 않습니다.`)
    }

    if (options.cache !== false) {
      await this.redisService.set(cacheKey, result, this.ttl)
      console.log(`저장된 CacheKey: ${cacheKey}`)
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
