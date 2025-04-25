import { Module } from '@nestjs/common'
import { AnswerService } from './application/answer.service'
import { AnswerController } from './answer.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from 'src/redis/redis.module'
import { Answer } from './entities/answer.entity'
import { FollowUp } from './entities/follow-up.entity'
import { Question } from 'src/question/entities/question.entity'
import { QuestionStack } from 'src/question/entities/question-stack.entity'
import { AnswerGeminiService } from './integrations/answer-gemini.service'
import { Conversation } from './entities/conversation.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Answer, FollowUp, Question, QuestionStack, Conversation]), RedisModule],
  controllers: [AnswerController],
  providers: [AnswerService, AnswerGeminiService]
})
export class AnswerModule {}
