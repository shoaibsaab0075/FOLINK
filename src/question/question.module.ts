import { Module } from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { QuestionController } from './question.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Question } from './entities/question.entity'
import { QuestionSet } from './entities/question-set.entity'
import { GeminiApiService } from './integrations/gemini-api.service'
import { RedisModule } from 'src/redis/redis.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionSet]), 
    RedisModule
  ],
  controllers: [QuestionController],
  providers: [QuestionService, GeminiApiService]
})
export class QuestionModule {}
