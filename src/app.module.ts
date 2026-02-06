import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { QuestionModule } from './question/question.module'
import { AnswerModule } from './answer/answer.module' // Asegúrate de que RedisModule esté comentado si existe
import { APP_PIPE } from '@nestjs/core'
import { MulterModule } from '@nestjs/platform-express'
import { UserModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { CoreModule } from './core/core.module'
import { FeedbackModule } from './feedback/feedback.module'

const imports = [
  MulterModule.register({
    dest: './uploads'
  }),
  QuestionModule,
  UserModule,
  AuthModule,
  CoreModule,
  FeedbackModule,
  AnswerModule
]

// Solo importa RedisModule si no estamos en desarrollo
if (process.env.NODE_ENV !== 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { RedisModule } = require('./redis/redis.module')
  imports.push(RedisModule)
}

@Module({
  imports,
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
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
