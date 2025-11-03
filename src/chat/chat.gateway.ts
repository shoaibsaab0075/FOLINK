import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AnswerService } from '../answer/application/answer.service';

interface ChatMessage {
  conversationId: number;
  message: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // En un entorno de producción, deberías restringir esto
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server!: Server;

  constructor(private readonly answerService: AnswerService) {}

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: ChatMessage): Promise<void> {
    try {
      const response = await this.answerService.handleConversation(payload.conversationId, payload.message);
      client.emit('message', response);
    } catch (error) {
      client.emit('error', { message: 'An error occurred', details: (error as Error).message });
    }
  }
}
