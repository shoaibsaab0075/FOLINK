/* eslint-disable prettier/prettier */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common'
import { map, Observable, tap } from 'rxjs'

@Injectable()
export class JsonRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const res = context.switchToHttp().getResponse()
    const path = req.originalUrl
    const now = new Date()

    console.log(`Path: ${path} TIME: ${now.toLocaleString('kr')}`)

    return next.handle().pipe(
      tap((data) => console.log('Response Data:', data)),

      map((data) => {
        const statusCode = res.statusCode || 200
        return {
          success: true,
          message: '응답 성공',
          statusCode,
          data
        }
      })
    )
  }
}
