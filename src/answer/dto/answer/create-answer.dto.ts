// create-answer.dto.ts
import { IsString } from 'class-validator'

export class CreateAnswerDto {
  @IsString()
  public userResponse: string
}
