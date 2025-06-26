/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as expressBasicAuth from 'express-basic-auth'
import * as cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor'
import { ErrorResponseInterceptor } from './common/interceptors/error-response.interceptor'
import * as dotenv from 'dotenv'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  })

  app.useGlobalInterceptors(new SuccessResponseInterceptor(), new ErrorResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.use(cookieParser())
  app.use(
    ['/api', '/api-jsom'],
    expressBasicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER as string]: process.env.SWAGGER_PW as string
      }
    })
  )
  const config = new DocumentBuilder()
    .setTitle('대용쌤과 함께하는 싱글벙글 마지막 캡스톤')
    .setDescription('Polink')
    .setVersion('1.0')
    .addBearerAuth()
    .addOAuth2()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
