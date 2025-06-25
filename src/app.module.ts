import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { QuestionModule } from './question/question.module'
import { RedisModule } from './redis/redis.module'
import { AnswerModule } from './answer/answer.module'
import { APP_PIPE } from '@nestjs/core'
import { MulterModule } from '@nestjs/platform-express'
import { UserModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { CoreModule } from './core/core.module'

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads'
    }),
    QuestionModule,
    RedisModule,
    AnswerModule,
    UserModule,
    AuthModule,
    CoreModule
  ],
  controllers: [AppController],
  providers: [
    {
      // 전역 파이프 설정 모든 반환값 DTO로 변환
      // transform: true: 요청 바디 데이터를 자동으로 DTO 클래스의 인스턴스로 변환, whitelist: true: DTO에 정의되지 않은 불필요한 속성을 제거
      provide: APP_PIPE,
      useClass: ValidationPipe,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true, // DTO에 없는 속성 포함 시 400 에러
        transformOptions: { enableImplicitConversion: true } // 암묵적 타입 변환 활성화
      })
    },
    AppService
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // AppModule에서 추가적인 전역 설정이 필요하면 여기에 추가
  }
}
