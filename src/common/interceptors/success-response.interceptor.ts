/* eslint-disable prettier/prettier */
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import { IApiResponse } from 'src/common/utils/api-response.util'

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SuccessResponseInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<any>> {
    const req = context.switchToHttp().getRequest()
    const path = req.originalUrl
    const now = new Date()
    const response = context.switchToHttp().getResponse()
    const statusCode = response.statusCode || HttpStatus.OK

    this.logger.log(`Request: ${req.method} ${path} at ${now.toLocaleString('kr')}`)

    return next.handle().pipe(
      map((data): IApiResponse<any> => {
        // 에러 응답인 경우 변환하지 않음
        if (data && data.statusCode && data.message && data.error) {
          return data
        }

        // 성공 응답 처리
        const message = data?.message || '응답 성공'
        const responseData = data?.data !== undefined ? data.data : data

        return {
          statusCode,
          message,
          data: responseData
        }
      })
    )
  }
}
