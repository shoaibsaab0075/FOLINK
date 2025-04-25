import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { IApiResponse } from 'src/util/api-response.util'

@Injectable()
export class ErrorResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorResponseInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<any>> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    return next.handle().pipe(
      catchError((err: any) => {
        // 컨트롤러에서 ApiResponseUtil.error로 반환된 경우
        if (err && err.statusCode && err.message && err.error) {
          response.status(err.statusCode) // HTTP 상태 코드 설정
          return throwError(() => new HttpException(err, err.statusCode))
        }

        // 예상치 못한 에러 처리
        const status =
          err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
        const message = err.message || '서버 오류 발생'

        const apiResponse: IApiResponse<null> = {
          statusCode: status,
          message,
          error: {
            code: err.name || 'UNKNOWN_ERROR'
          }
        }

        this.logger.error(`[${request.method}] ${request.url} - ${message}`)

        response.status(status) // HTTP 상태 코드 설정
        return throwError(() => new HttpException(apiResponse, status))
      })
    )
  }
}
