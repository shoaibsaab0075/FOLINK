import { Expose } from 'class-transformer'
import { IsNumber, IsString } from 'class-validator'

export class TechStackQuestionDto {
  @Expose()
  @IsNumber()
  public readonly id: number

  @Expose()
  @IsString()
  public readonly stack: string

  @Expose()
  @IsString()
  public readonly question: string

  @Expose()
  @IsString()
  public readonly purpose: string
}
