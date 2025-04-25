import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  public readonly userResponse: string
}
