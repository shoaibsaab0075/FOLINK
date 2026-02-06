import { Controller, Get, Inject, Optional } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthIndicatorFunction
} from '@nestjs/terminus'
import Redis from 'ioredis'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    // Inyectamos el cliente de Redis de forma opcional.
    // Si no se provee (en desarrollo), será `null`.
    @Optional() @Inject('REDIS_HEALTH_CLIENT') private readonly redisClient: Redis
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const healthChecks: HealthIndicatorFunction[] = [
      () => this.db.pingCheck('database', { timeout: 300 })
    ]

    // Si el cliente de Redis fue inyectado (entornos no-dev), añadimos su chequeo.
    if (this.redisClient) {
      healthChecks.push(async () => {
        const pong = await this.redisClient.ping()
        if (pong !== 'PONG')
          throw new HealthCheckError('Redis ping failed', { redis: { status: 'down' } })
        return { redis: { status: 'up' } }
      })
    }

    return this.health.check(healthChecks)
  }
}
