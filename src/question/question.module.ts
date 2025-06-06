import { forwardRef, Module, ValidationPipe } from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { QuestionController } from './question.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Question } from './entities/question.entity'
import { QuestionSet } from './entities/question-set.entity'
import { QuestionGeminiService } from './integrations/question-gemini.service'
import { RedisModule } from 'src/redis/redis.module'
import { AnswerModule } from 'src/answer/answer.module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { QuestionStack } from './entities/question-stack.entity'
import { Conversation } from 'src/answer/entities/conversation.entity'
import { Message } from 'src/answer/entities/message.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionSet, QuestionStack, Conversation, Message]),
    RedisModule,
    forwardRef(() => AnswerModule),
    EventEmitterModule.forRoot()
  ],
  controllers: [QuestionController],
  providers: [QuestionService, QuestionGeminiService],
  exports: [QuestionService]
})
export class QuestionModule {}
