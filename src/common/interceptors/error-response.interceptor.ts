import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

@Injectable()
export class ErrorResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorResponseInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    return next.handle().pipe(
      catchError((err) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500
        const response = err instanceof HttpException ? err.getResponse() : '서버 내부 오류'
        const errorMessage =
          typeof response === 'object' && 'message' in response
            ? Array.isArray(response.message)
              ? response.message.join(', ')
              : response.message
            : response

        this.logger.error(`Error at ${req.method} ${req.url}:`, {
          statusCode,
          message: errorMessage,
          error: err.message,
          stack: err.stack
        })

        throw new HttpException(
          {
            success: false,
            message: '응답 실패',
            error: {
              message: errorMessage,
              name: err.name || 'UnknownError'
            },
            statusCode
          },
          statusCode
        )
      })
    )
  }
}
