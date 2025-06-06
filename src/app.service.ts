/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { Test } from './app.test.entity'
import { TestDto } from './app.test.dto'

@Injectable()
export class AppService {
  private test: Test[] = []

  getHello(): string {
    return 'Test Message!'
  }

  getDate(): Test[] {
    return this.test
  }

  getOneDate(id: number) {
    const test =  this.test.find(test => test.id === id)
    return test
  }
}
