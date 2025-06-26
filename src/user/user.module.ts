import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './application/user.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { UserFactory } from './factory/user.factory'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService, UserFactory],
  exports: [UserService]
})
export class UserModule {}
