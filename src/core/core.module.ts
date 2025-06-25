import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigurationModule } from 'src/configuration/configuration.module'
import { join } from 'path'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_SCHEMA'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: config.get<boolean>('TYPEORM_SYNCHRONIZE'),
        logging: true, // 로깅 활성화
        logger: 'advanced-console',
      })
    })
  ],
  exports: [TypeOrmModule]
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
