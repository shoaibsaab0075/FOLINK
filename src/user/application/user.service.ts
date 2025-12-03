import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'
import { CreateUserDto } from '../dto/create-user.dto'
import { UpdateUserDto } from '../dto/update-user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../entities/user.entity'
import { Repository } from 'typeorm'
import { UserFactory } from '../factory/user.factory'
import { ResponseUserDto } from '../dto/response-user.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
    private readonly userFactory: UserFactory
  ) {}

  public async createUser(dto: CreateUserDto): Promise<ResponseUserDto> {
    const user = await this.userFactory.createUser(dto)
    const savedUser = await this.user.save(user)
    this.logger.log(`User created with ID: ${savedUser.id}, username: ${savedUser.username}`)

    return ResponseUserDto.fromEntity(savedUser)
  }

  public async getOneUser(id: number): Promise<User | null> {
    const user = await this.user.findOne({
      where: {
        id
      }
    })
    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다. ID: ${id}`)
    }
    return user
  }

  async findAllUser(): Promise<ResponseUserDto[]> {
    const users = await this.user.find()
    return users.map((user) => ResponseUserDto.fromEntity(user))
  }

  public async checkUsername(username: string): Promise<void> {
    const existing = await this.user.findOne({
      where: [{ username }]
    })

    if (existing) {
      throw new ConflictException(`${username}은 이미 사용 중인 사용자 이름입니다.`)
    }
  }

  public async updateUserStatus(
    id: number,
    updateUserDto: UpdateUserDto
  ): Promise<ResponseUserDto> {
    const user: User | null = await this.getOneUser(id)
    if (updateUserDto.username) {
      await this.checkUsername(updateUserDto.username)
    }
    await user!.updateUser(updateUserDto)
    const userStatus = await this.user.save(user as User)
    this.logger.log(`User updated with ID: ${id}`)

    return ResponseUserDto.fromEntity(userStatus)
  }

  async deleteUser(id: number): Promise<void> {
    const user: User | null = await this.getOneUser(id)
    await user!.deleteUser()
    this.logger.log(`User deleted with ID: ${id}`)
  }

  public async findUserByLogin(login: string, secret = false): Promise<User | undefined> {
    return (
      (await this.user.findOne({
        where: [{ username: login }],
        select: {
          id: true,
          username: true,
          password: secret,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          deletedAt: true
        }
      })) ?? undefined
    )
  }
}
