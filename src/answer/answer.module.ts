import { forwardRef, Module } from '@nestjs/common'
import { AnswerService } from './application/answer.service'
import { AnswerController } from './answer.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from 'src/redis/redis.module'
import { AnswerGeminiService } from './integrations/answer-gemini.service'
import { Conversation } from './entities/conversation.entity'
import { Message } from './entities/message.entity'
import { QuestionModule } from 'src/question/question.module'
import { Question } from 'src/question/entities/question.entity'

const moduleImports: any[] = [
  TypeOrmModule.forFeature([Conversation, Message, Question]),
  forwardRef(() => QuestionModule)
]

// Only include Redis in non-development environments to allow running without Redis locally
if (process.env.NODE_ENV !== 'development') {
  moduleImports.push(RedisModule)
}

@Module({
  imports: moduleImports,
  controllers: [AnswerController],
  providers: [AnswerService, AnswerGeminiService],
  exports: [AnswerService]
})
export class AnswerModule {}
