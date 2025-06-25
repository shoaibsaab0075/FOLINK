import { User } from "../entities/user.entity"

export class ResponseUserDto {
  id!: number
  username!: string
  password!: string
  createdAt!: Date
  updatedAt!: Date
  isDeleted!: boolean
  deletedAt?: Date | null

  static fromEntity(user: User): ResponseUserDto {
    const dto = new ResponseUserDto()
    dto.id = user.id
    dto.username = user.username
    dto.password = user.password
    dto.createdAt = user.createdAt
    dto.updatedAt = user.updatedAt
    dto.isDeleted = user.isDeleted
    dto.deletedAt = user.deletedAt ?? null
    return dto
  }
}
