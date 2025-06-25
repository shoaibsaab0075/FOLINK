/* eslint-disable prettier/prettier */
import { IsNumber, IsString } from 'class-validator'

export class TestDto {
  @IsNumber()
  id!: number

  @IsString({ message: 'name: 문자열만 입력' })
  name!: string

  @IsString({ message: 'PW: 문자열만 입력' })
  password!: string
}
