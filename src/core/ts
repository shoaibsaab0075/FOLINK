import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist'
import { ConfigurationModule } from 'src/configuration/configuration.module'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbType = config.get<string>('DB_TYPE')
        const isDevelopment = config.get<string>('NODE_ENV') === 'development'

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: config.get<string>('DB_DATABASE', 'db.sqlite'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            // En desarrollo, synchronize: true crea el esquema de la BD automáticamente.
            // ¡NUNCA USAR EN PRODUCCIÓN!
            synchronize: true,
            logging: isDevelopment,
            logger: 'advanced-console'
          }
        }

        // Configuración por defecto para PostgreSQL (producción)
        return {
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_DATABASE') || config.get('DB_SCHEMA'), // Compatible con DB_DATABASE o DB_SCHEMA
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: config.get<boolean>('TYPEORM_SYNCHRONIZE', false), // Por seguridad, false en producción
          logging: isDevelopment,
          logger: 'advanced-console',
          extra: {
            ssl: config.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false
          }
        }
      }
    })
  ],
  exports: [TypeOrmModule]
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
