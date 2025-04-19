/* eslint-disable prettier/prettier */
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { map, Observable, tap } from 'rxjs'

@Injectable()
export class JsonRequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(JsonRequestInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const path = req.originalUrl
    const now = new Date()

    this.logger.log(`Request: ${req.method} ${path} at ${now.toLocaleString('kr')}`)

    return next.handle().pipe(
      tap((data) => console.log('Response Data:', data)),
      map((data) => {
        // 컨트롤러에서 message가 제공되면 사용, 없으면 기본값
        const message = data?.message || '응답 성공'
        // data 객체에서 message를 제외한 나머지 데이터를 추출
        const responseData = data?.data !== undefined ? data.data : data

        return {
          // success: true,
          message: message,
          data: responseData
        }
      })
    )
  }
}
