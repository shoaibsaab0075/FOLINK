import { Module, ValidationPipe } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigurationModule } from './configuration/configuration.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { QuestionModule } from './question/question.module'
import { RedisModule } from './redis/redis.module'
import { AnswerModule } from './answer/answer.module'
import { APP_PIPE } from '@nestjs/core'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_SCHEMA'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get<boolean>('TYPEORM_SYBCHRONIZE')
      })
    }),
    ConfigurationModule,
    QuestionModule,
    RedisModule,
    AnswerModule
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
export class AppModule {}
