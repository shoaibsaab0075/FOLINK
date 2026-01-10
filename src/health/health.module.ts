import { Inject, Module, OnModuleDestroy, Optional } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { HealthController } from './health.controller'
import Redis from 'ioredis'

// Proveedor condicionasi  para el cliente de Redis
const redisClientProvider = {
  provide: 'REDIS_HEALTH_CLIENT', // Un token claro para la inyección
  useFactory: () => {
    if (process.env.NODE_ENV !== 'development') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis')
      // Usamos valores por defecto para evitar errores si las variables no están definidas
      const host = process.env.REDIS_HOST || 'localhost'
      const port = parseInt(process.env.REDIS_PORT || '6379', 10)
      return new Redis({ host, port })
    }
    return null // En desarrollo, no proveemos cliente para que la inyección sea opcional
  }
}

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [redisClientProvider]
})
export class HealthModule implements OnModuleDestroy {
  constructor(@Optional() @Inject('REDIS_HEALTH_CLIENT') private readonly redisClient: Redis) {}

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect()
    }
  }
}
