import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GeminiApiError } from 'src/common/errors'
import { CacheKeyGenerator } from 'src/common/utils/cache-key-generator'
import { RedisService } from 'src/redis/redis.service'

@Injectable()
export class QuestionGeminiService {
  private readonly genAI: GoogleGenerativeAI
  private readonly model: GenerativeModel
  private readonly ttl: number

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    this.ttl = this.configService.get<number>('REDIS_TTL', 1800)
  }

  /**
   * 캐시 키 생성 후 암호화 (text와 type을 기반으로 고유한 키 생성)
   */
  private generateCacheKey(text: string, type: string = ''): string {
    return CacheKeyGenerator.generateKey('questions:v2', text, type)
  }

  /**
   * 질문 생성 프롬프트 작성
   */
  private buildPrompt(text: string): string {
    return `
      당신은 포트폴리오 분석 전문가인 AI입니다. 사용자가 제공한 포트폴리오(텍스트, PDF)를 분석하여 두 가지 유형의 면접 질문을 생성하고, 결과를 JSON 형식으로 출력하는 것이 목표입니다: (1) 각 프로젝트의 기술 스택에 대한 전형적인 기술 질문, (2) 프로젝트별 기술 스택 사용 맥락에 초점을 맞춘 질문. 평가 목적은 **기술 선택**, **구현 방식**, **문제 해결**, **성과 평가** 4가지로 제한됩니다. 다음 지침을 엄격히 따르세요:

      1. **입력 처리**:  
         - 사용자가 제공한 포트폴리오에서 프로젝트명, 사용된 기술 스택(예: React, TensorFlow, AWS 등), 프로젝트 목표, 주요 작업, 성과 등을 식별합니다.  
         - 기술 스택은 각 프로젝트에 연결된 목록으로 정리합니다.  
         - 정보가 불명확하거나 부족한 경우, 사용자에게 간단한 확인 질문을 제안합니다(예: '프로젝트 A의 데이터베이스 기술이 명시되지 않았습니다. 추가로 알려주시겠습니까?').  

      2. **질문 생성 규칙**:  
         - **tech_stack 질문**:  
           - 프로젝트와 독립적으로, 포트폴리오에 등장한 기술 스택(예: TensorFlow, Docker)에 대한 전형적인 면접 질문을 생성합니다.  
           - 질문은 기술의 일반적인 사용법, 특징, 최적화 기법, 장단점을 다루며, 평가 목적(기술 선택, 구현 방식, 문제 해결, 성과 평가) 중 하나에 맞춰야 합니다.  
           - 예: 'TensorFlow에서 모델 학습 속도를 높이기 위해 어떤 기법을 사용할 수 있나요?' (구현 방식)  
           - 각 기술당 1~2개의 질문을 생성하며, 평가 목적을 균형 있게 분배합니다.  
         - **projects 질문**:  
           - 각 프로젝트에 맞춰, 해당 프로젝트에서 사용된 기술 스택의 맥락을 반영한 질문을 생성합니다.  
           - 질문은 다음 4가지 평가 목적에 맞춘 전형적인 패턴을 따릅니다:  
             - **기술 선택**: 왜 해당 기술을 선택했는지 묻는 질문.  
             - **구현 방식**: 기술을 프로젝트에서 어떻게 활용했는지 묻는 질문.  
             - **문제 해결**: 기술 사용 중 겪은 도전과 해결 방법을 묻는 질문.  
             - **성과 평가**: 기술로 달성한 성과나 최적화 사례를 묻는 질문.  
           - 각 프로젝트당 2~4개의 질문을 생성하며, 사용된 기술 스택을 골고루 다루고, 평가 목적을 균형 있게 배분합니다.  
         - 모든 질문은 간결해야 하며, 한 문장으로 충분하면 두 문장으로 늘리지 않습니다.  
         - 질문은 지원자의 기술적 깊이, 실무 적용 능력, 문제 해결 경험을 평가할 수 있도록 설계합니다.  

      3. **질문 수**:  
         - tech_stack: 포트폴리오 전체에서 사용된 각 기술당 1~2개의 전형적인 질문.  
         - projects: 각 프로젝트당 2~4개의 기술 스택 관련 질문.  
         - 중복 질문은 피하고, 기술 스택과 평가 목적의 다양성을 고려해 균형 있게 생성합니다.  

      4. **출력 형식**:  
         - 결과는 **JSON 객체**로 출력하며, 다음 구조를 따릅니다:  
           {
             "tech_stack": [
               {
                 "stack": "[기술명, 예: TensorFlow]",
                 "questions": [
                   {
                     "id": [질문 번호, 1부터 시작],
                     "text": "[전형적인 기술 질문 내용]",
                     "purpose": "[기술 선택|구현 방식|문제 해결|성과 평가]"
                   },
                   ...
                 ]
               },
               ...
             ],
             "projects": [
               {
                 "project_name": "[프로젝트명]",
                 "tech_stack": ["[기술1]", "[기술2]", ...],
                 "questions": [
                   {
                     "id": [질문 번호, 1부터 시작],
                     "text": "[프로젝트 맥락 기반 질문, 기술과 프로젝트명 포함]",
                     "purpose": "[기술 선택|구현 방식|문제 해결|성과 평가]"
                   },
                   ...
                 ]
               },
               ...
             ]
           }  
         - tech_stack 섹션은 포트폴리오 전체의 기술별 전형적인 질문을 포함합니다.  
         - projects 섹션은 프로젝트별 기술 스택과 맥락 기반 질문을 포함하며, tech_stack 필드로 해당 프로젝트의 기술 목록을 명시합니다.  
         - purpose는 반드시 '기술 선택', '구현 방식', '문제 해결', '성과 평가' 중 하나로 제한됩니다.  
         - JSON은 가독성을 위해 적절히 들여쓰기(indent=2)를 적용합니다.  

      다음 포트폴리오를 분석하여 위 지침에 따라 질문을 생성하고 JSON 형식으로 출력하세요:
      ${text}

      마크다운(예: \`\`\`json)이나 추가 텍스트는 포함시키지 마세요.
    `
  }

  /**
   * 텍스트를 기반으로 프로젝트 및 기술 질문 생성
   */
  public async generateQuestions(text: string): Promise<{
    tech_stack: { stack: string; questions: { id: number; text: string; purpose: string }[] }[]
    projects: {
      project_name: string
      tech_stack: string[]
      questions: { id: number; text: string; purpose: string }[]
    }[]
  }> {
    const cacheKey = this.generateCacheKey(text, 'combined')
    const cachedData = await this.redisService.get<{
      tech_stack: {
        stack: string
        questions: { id: number; text: string; purpose: string }[]
      }[]
      projects: {
        project_name: string
        tech_stack: string[]
        questions: { id: number; text: string; purpose: string }[]
      }[]
    }>(cacheKey)
    if (cachedData) {
      console.log(`CacheKey: ${cacheKey}`)
      return cachedData
    }

    const prompt = this.buildPrompt(text)
    const rawText = await this.getGeminiResponse(prompt)
    const result = this.parseGeminiResponse<{
      tech_stack: {
        stack: string
        questions: { id: number; text: string; purpose: string }[]
      }[]
      projects: {
        project_name: string
        tech_stack: string[]
        questions: { id: number; text: string; purpose: string }[]
      }[]
    }>(rawText)

    // 검증
    if (!result.tech_stack || !result.projects) {
      throw new GeminiApiError('Gemini 응답에 tech_stack 또는 projects가 누락되었습니다.')
    }
    for (const tech of result.tech_stack) {
      if (!tech.stack || !tech.questions || tech.questions.length < 1) {
        throw new GeminiApiError(`기술 ${tech.stack}의 질문이 유효하지 않습니다.`)
      }
      for (const q of tech.questions) {
        if (!['기술 선택', '구현 방식', '문제 해결', '성과 평가'].includes(q.purpose)) {
          throw new GeminiApiError(`질문 ${q.text}의 purpose가 유효하지 않습니다.`)
        }
      }
    }
    for (const project of result.projects) {
      if (
        !project.project_name ||
        !project.tech_stack ||
        !project.questions ||
        project.questions.length < 2
      ) {
        throw new GeminiApiError(`프로젝트 ${project.project_name}의 질문이 유효하지 않습니다.`)
      }
      for (const q of project.questions) {
        if (!['기술 선택', '구현 방식', '문제 해결', '성과 평가'].includes(q.purpose)) {
          throw new GeminiApiError(`질문 ${q.text}의 purpose가 유효하지 않습니다.`)
        }
      }
    }

    await this.redisService.set(cacheKey, result, this.ttl)
    console.log(`저장된 CacheKey: ${cacheKey}`)

    return result
  }

  /**
   * Gemini API 호출로 프롬프트에 대한 답변 생성
   */
  private async getGeminiResponse(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt)
    const response = result.response
    const rawText = response.text()
    console.log('Raw Gemini response:', rawText)
    return rawText
  }

  /**
   * 응답에서 마크다운(```json 등)을 제거하고 JSON을 파싱해 데이터를 추출
   */
  private parseGeminiResponse<T>(rawText: string): T {
    try {
      const cleanedText = rawText.replace(/```json|```/g, '').trim()
      console.log('Cleaned response:', cleanedText)
      return JSON.parse(cleanedText)
    } catch (error: any) {
      throw new GeminiApiError('Gemini 응답 파싱 실패: ' + error.message)
    }
  }
}
