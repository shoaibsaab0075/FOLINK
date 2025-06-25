import { Message } from 'src/answer/entities/message.entity'

export const FEEDBACK_GENERATOR_TOKEN = 'IFeedbackGenerator'

export interface IFeedbackGenerator {
  generateFinalFeedback(conversationId: number, messages: Message[]): Promise<string>
}
