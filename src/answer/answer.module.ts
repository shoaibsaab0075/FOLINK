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

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Question]),
    RedisModule,
    forwardRef(() => QuestionModule)
  ],
  controllers: [AnswerController],
  providers: [AnswerService, AnswerGeminiService],
  exports: [AnswerService]
})
export class AnswerModule {}
