/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as expressBasicAuth from 'express-basic-auth'
import * as cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { JsonRequestInterceptor } from './interceptors/json-request.interceptor'
import { ErrorResponseInterceptor } from './interceptors/error-response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  })

  app.useGlobalInterceptors(
    new JsonRequestInterceptor(),
    new ErrorResponseInterceptor()
  )

  app.use(cookieParser())
  app.use(
    ['/api', '/api-jsom'],
    expressBasicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER]: process.env.SWAGGER_PW
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
