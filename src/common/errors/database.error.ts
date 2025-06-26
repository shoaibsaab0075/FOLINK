import { HttpException, HttpStatus } from "@nestjs/common"

export class DatabaseError extends HttpException {
  public readonly details?: string[]

  constructor(message: string, details?: string[]) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR)
    this.name = 'DatabaseError'
    this.details = details
  }
}