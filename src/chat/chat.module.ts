import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AnswerModule } from '../answer/answer.module';

@Module({
  imports: [AnswerModule],
  providers: [ChatGateway],
})
export class ChatModule {}
