import { Expose } from 'class-transformer'
import { IsNumber, IsString } from 'class-validator'
import { ProjectQuestionDto } from './response-project-question.dto'
import { TechStackQuestionDto } from './response-stack-question.dto'

export class CreateQuestionSetDto {
  @Expose()
  @IsNumber()
  public readonly id: number

  @Expose()
  @IsString()
  public readonly originalText: string

  @Expose()
  public projectQuestions: ProjectQuestionDto[]

  @Expose()
  public techStackQuestions: TechStackQuestionDto[]
}
