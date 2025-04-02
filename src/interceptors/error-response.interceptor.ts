import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'

@Injectable()
export class ErrorResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
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

        throw new HttpException(
          {
            success: false,
            message: '응답 실패',
            error: errorMessage,
            statusCode
          },
          statusCode
        )
      })
    )
  }
}
