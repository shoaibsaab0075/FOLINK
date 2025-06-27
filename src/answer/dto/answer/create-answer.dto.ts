// create-answer.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateAnswerDto {
  @IsString()
  @ApiProperty({
    description: '사용자가 입력한 텍스트',
    default: '잘 모르겠습니다.'
  })
  public userResponse!: string
}
