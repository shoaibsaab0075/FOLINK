import { QuestionType } from '../enum/question.type'

export class QuestionCreatedEvent {
  constructor(
    public readonly questionId: number,
    public readonly questionText: string,
    public readonly type: QuestionType
  ) {}
}
