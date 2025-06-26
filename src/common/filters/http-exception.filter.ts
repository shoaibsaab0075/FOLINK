import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common'
import { ApiResponseUtil } from '../utils/api-response.util'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR

    response
      .status(status)
      .json(ApiResponseUtil.error(exception.message || '내부 서버 오류', status, exception.error))
  }
}
