import { Module } from '@nestjs/common'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './application/feedback.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Feedback } from './entities/feedback.entity'
import { Conversation } from 'src/answer/entities/conversation.entity'
import { FeedbackGeminiService } from './integrations/feedback-gemini.service'
import { FEEDBACK_GENERATOR_TOKEN } from './interfaces/feedback-generator.interface'
import { RedisModule } from 'src/redis/redis.module'

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, Conversation]), RedisModule],
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    FeedbackGeminiService,
    {
      provide: FEEDBACK_GENERATOR_TOKEN, // 토큰 정의
      useClass: FeedbackGeminiService // useClass로 클래스 바인딩
    }
  ],
  exports: [FeedbackService]
})
export class FeedbackModule {}
