import { HttpException, HttpStatus } from "@nestjs/common"

export class GeminiApiError extends HttpException {
  public readonly details?: string[]

  constructor(message: string, details?: string[]) {
    super(message, HttpStatus.BAD_REQUEST)
    this.name = 'GeminiApiError'
    this.details = details
  }
}
