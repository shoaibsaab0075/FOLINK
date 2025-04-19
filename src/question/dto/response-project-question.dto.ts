import { Expose } from 'class-transformer'
import { IsNumber, IsString } from 'class-validator'

export class ProjectQuestionDto {
  @Expose()
  @IsNumber()
  public readonly id: number

  @Expose()
  @IsString()
  public readonly projectName: string

  @Expose()
  @IsString()
  public readonly question: string

  @Expose() // 이걸 제거하면 반환되는 DTO값에 반영되지않음
  @IsString()
  public readonly purpose: string
}
