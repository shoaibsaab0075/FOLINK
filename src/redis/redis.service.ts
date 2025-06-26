import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  private client: Redis

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379)
    })
  }

  public async onModuleInit() {
    await this.client.ping() // Redis 연결 확인
    console.log('Redis connected')
  }

  public async onModuleDestroy() {
    await this.client.quit() // Redis 연결 종료
  }

  // 카 값으로 조회
  public async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }

  // 저장
  public async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl)
  }

  // 키값으로 삭제
  public async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern)
  }
}
