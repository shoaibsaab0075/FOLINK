import { Expose } from 'class-transformer'
import { IsDate, IsNumber, IsString } from 'class-validator'
import { QuestionDto } from './question.dto'

export class CreateQuestionSetDto {
  @Expose()
  @IsNumber()
  public readonly id: number

  @Expose()
  @IsString()
  public readonly originalText: string

  @Expose()
  public questions: QuestionDto[]

//   @Expose()
//   @IsDate()
//   public readonly createdAt: Date
}
