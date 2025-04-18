import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateQuestionDto {
  @ApiProperty({
    description: '텍스트',
    default: '저는 열정적인 인재이며 NestJS를 활용한 프로젝트 경험이 다수 있습니다.'
  })
  @IsNotEmpty()
  @IsString()
  public readonly text: string
}
