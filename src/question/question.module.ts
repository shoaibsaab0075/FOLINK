import { Module } from '@nestjs/common'
import { QuestionService } from './application/question.service'
import { QuestionController } from './question.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Question } from './entities/question.entity'
import { QuestionSet } from './entities/question-set.entity'
import { QuestionGeminiService } from './integrations/question-gemini.service'
import { RedisModule } from 'src/redis/redis.module'

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionSet]), RedisModule],
  controllers: [QuestionController],
  providers: [QuestionService, QuestionGeminiService]
})
export class QuestionModule {}
