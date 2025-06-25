import { Injectable } from "@nestjs/common"
import * as bcrypt from 'bcryptjs'
import { CreateUserDto } from "../dto/create-user.dto"
import { User } from "../entities/user.entity"

@Injectable()
export class UserFactory {
  async createUser(dto: CreateUserDto): Promise<User> {
    const user = new User()
    user.username = dto.username,
    user.password = await bcrypt.hash(dto.password, await bcrypt.genSalt()),
    user.isDeleted = false,
    user.createdAt = new Date(),
    user.updatedAt = new Date(),
    user.deletedAt = null
    return user
  }
}