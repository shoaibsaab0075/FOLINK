import { Expose } from 'class-transformer'
import { IsDate, IsNumber, IsString } from 'class-validator'

export class QuestionDto {
  @Expose()
  @IsNumber()
  public readonly id: number

  @Expose()
  @IsString()
  public readonly title: string

  @Expose()
  @IsString()
  public readonly question: string

//   @Expose() // 이걸 제거하면 반환되는 DTO값에 반영되지않음
//   @IsDate()
//   public readonly createdAt: Date
}
