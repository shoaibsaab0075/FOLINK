import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class ResponseFollowUpQuestionDto {
  @ApiProperty()
  @Expose()
  public readonly id: number

  @ApiProperty()
  @Expose()
  public readonly text: string

  @ApiProperty()
  @Expose()
  public readonly purpose: string
}
