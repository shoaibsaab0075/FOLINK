import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { IApiResponse } from '../utils/api-response.util'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    let message: string
    let errorDetails: any

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
    } else {
      const res = exceptionResponse as { message: string | string[]; error: string }
      message = Array.isArray(res.message) ? res.message.join(', ') : res.message
      errorDetails = res.error
    }

    const apiResponse: IApiResponse<null> = {
      statusCode: status,
      message: message,
      error: {
        code: errorDetails || HttpStatus[status],
      },
    }

    response.status(status).json(apiResponse)
  }
}