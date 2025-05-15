import { HttpStatus } from "@nestjs/common"

export interface IApiResponse<T> {
  statusCode: number
  message: string
  data?: T
  error?: {
    code: string
    details?: string
  }
}

export class ApiResponseUtil {
  static success<T>(data: T, message: string, statusCode: number = HttpStatus.OK): IApiResponse<T> {
    return {
      statusCode,
      message,
      data
    }
  }

  static error(
    message: string,
    statusCode: number,
    errorDetails?: { code?: string; details?: string }
  ): IApiResponse<null> {
    return {
      statusCode,
      message,
      error: {
        code: errorDetails?.code || 'UNKNOWN_ERROR',
        details: errorDetails?.details
      }
    }
  }
}
