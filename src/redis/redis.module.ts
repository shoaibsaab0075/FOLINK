import { Module } from '@nestjs/common'
import { RedisService } from './redis.service'
import { ConfigurationModule } from 'src/configuration/configuration.module'

@Module({
  imports: [ConfigurationModule],
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {}
