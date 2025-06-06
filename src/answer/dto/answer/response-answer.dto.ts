import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class ResponseAnswerDto {
  @ApiProperty()
  @Expose()
  public readonly id: number

  @ApiProperty()
  @Expose()
  public readonly user_response: string

  @ApiProperty()
  @Expose()
  public readonly created_at: Date
}
