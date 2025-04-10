import { Injectable } from '@nestjs/common'
import { CreateQuestionDto } from '../dto/create-question.dto'
import { Question } from '../entities/question.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DatabaseError } from 'src/common/error'
import { QuestionSet } from '../entities/question-set.entity'
import { plainToClass } from 'class-transformer'
import { QuestionDto } from '../dto/question.dto'
import { CreateQuestionSetDto } from '../dto/create-question-set.dto'
import { GeminiApiService } from '../integrations/gemini-api.service'

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(QuestionSet)
    private readonly questionSetRepository: Repository<QuestionSet>,
    private readonly geminiApiService: GeminiApiService
  ) {}

  /**
   * QuestionSet과 Question 엔티티를 생성한 후 DB에 저장
   * 결과를 CreateQuestionSetDto로 변환해 반환
   */
  public async createQuestion(dto: CreateQuestionDto): Promise<CreateQuestionSetDto> {
    const questionData = await this.geminiApiService.generateQuestions(dto.text)
    const questionSet = QuestionSet.createQuestionSet(dto.text)         // 팩토리 메서드를 호출해서 객체를 초기화 시킨 후 사용자가 입력한 text값을  전달
    const questions = questionData.map(({ title, question }) =>         // Question 객체 생성 (구조 분해 할당으로 title과 question 추출)
      Question.createQuestion(title, question, questionSet)       
    )
    questions.forEach((question) => questionSet.addQuestion(question))  // questions 배열을 순회하면서 QuestionSet의 questions 배열에 Question 추가
    const savedSet = await this.saveQuestionSet(questionSet)

    return this.toDto(savedSet)  // DTO 변환 및 반환
  }

  /**
   * QuestionSet, Questions 객체를 DB에 저장 - { cascade: true } 옵션으로 Questions도 같이 DB에 저장됨
   */
  private async saveQuestionSet(questionSet: QuestionSet): Promise<QuestionSet> {
    try {
      return await this.questionSetRepository.save(questionSet)
    } catch (error) {
      throw new DatabaseError('데이터베이스 저장 실패: ' + error.message)
    }
  }

  /**
   * QuestionSet 객체를 CreateQuestionSetDto로 변환
   * 민감한 데이터 노출, 순환 참조 문제, 불필요한 데이터 전송 등을 방지
   */
  private toDto(questionSet: QuestionSet): CreateQuestionSetDto {
    const questionSetDto = plainToClass(CreateQuestionSetDto, questionSet, {    // 일반 객체를 DTO 클래스로 변환
      excludeExtraneousValues: true                                             // DTO에 정의되지 않은 속성(예: questionSet 속성)을 제외 @Expose()없는 것도 제외
    })
    questionSetDto.questions = questionSet.questions.map((q) =>                 // Question 배열을 순회하며 QuestionDto로 변환
      plainToClass(QuestionDto, q, { excludeExtraneousValues: true })
    )
    return questionSetDto
  }
}
