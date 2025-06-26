import { Expose } from 'class-transformer'

export class ResponseFeedbackDto {
  @Expose()
  public readonly id!: number

  @Expose()
  public readonly content!: string

  @Expose()
  public readonly strengths!: string

  @Expose()
  public readonly overallImpression!: string

  @Expose()
  public readonly improvementPoints!: string

  @Expose()
  public readonly additionalAdvice!: string

  @Expose()
  public readonly createdAt!: Date
}
